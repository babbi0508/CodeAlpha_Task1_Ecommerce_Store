const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem("shopnest-cart") || "[]"),
  favorites: JSON.parse(localStorage.getItem("shopnest-favorites") || "[]"),
  showFavorites: false,
  category: "All",
  search: "",
  user: null,
  authMode: "login",
  page: 1,
  pageSize: 24
};
let toastTimer;

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}
async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}
function saveCart() {
  localStorage.setItem("shopnest-cart", JSON.stringify(state.cart));
  renderCartCount();
}
function renderCartCount() {
  $("#cartCount").textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
}
async function loadProducts() {
  try {
    state.products = await api("/api/products");
    renderProducts();
  } catch {
    $("#productGrid").innerHTML = '<div class="empty-state">Could not load products. Please refresh the page.</div>';
  }
}
function renderProducts() {
  let products = state.products.filter(p =>
    (state.category === "All" || state.category === p.category) &&
    (!state.search || (p.name + " " + p.description + " " + p.category).toLowerCase().includes(state.search.toLowerCase()))
  );
  if (state.showFavorites) products = products.filter(p => state.favorites.includes(p.id));
  const visibleProducts = products.slice(0, state.page * state.pageSize);
  $("#shopEyebrow").textContent = state.showFavorites ? "YOUR SAVED PICKS" : "THE SHOP";
  $("#shopTitle").innerHTML = state.showFavorites ? 'Your favourites<span class="brand-dot">.</span>' : 'Find your favourites<span class="brand-dot">.</span>';
  $("#shopSubtitle").textContent = state.showFavorites ? `${products.length} saved product(s).` : `${products.length.toLocaleString()} products to explore.`;
  $("#categoryRow").classList.toggle("hidden", state.showFavorites);
  $("#favoritesButton").classList.toggle("active-nav", state.showFavorites);
  $("#productGrid").innerHTML = visibleProducts.length ? visibleProducts.map((p, index) => `
    <article class="product-card">
      <div class="product-image-wrap" data-details="${p.id}" tabindex="0" role="button" aria-label="View ${escapeHTML(p.name)} details">
        <img class="product-image" src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.onerror=null;this.style.visibility='hidden';this.parentElement.classList.add('image-unavailable')">
        ${index === 0 && state.page === 1 && !state.showFavorites ? '<span class="product-tag">POPULAR PICK</span>' : index === 3 && state.page === 1 && !state.showFavorites ? '<span class="product-tag">EVERYDAY FAVOURITE</span>' : ""}
        <button class="favorite-button ${state.favorites.includes(p.id) ? "active" : ""}" data-favorite="${p.id}" aria-label="${state.favorites.includes(p.id) ? "Remove from" : "Add to"} favorites" type="button">${state.favorites.includes(p.id) ? "♥" : "♡"}</button>
        <button class="quick-add" data-add="${p.id}" type="button">＋ Add to bag</button>
      </div>
      <div class="product-info"><div><p class="product-name">${escapeHTML(p.name)}</p><span class="product-category">${escapeHTML(p.category)}</span></div><span class="product-price">${money(p.price)}</span></div>
    </article>`).join("") : state.showFavorites
      ? '<div class="empty-favorites"><strong>No favourites saved yet.</strong>Tap the ♡ on any product to save it here.<br><button class="primary-button" id="browseAllButton">Browse products <span>→</span></button></div>'
      : '<div class="empty-state">No products found. Try another search.</div>';
  const loadMore = $("#loadMoreProducts");
  loadMore.classList.toggle("hidden", visibleProducts.length >= products.length || products.length === 0);
  loadMore.textContent = `Load more products (${Math.max(0, products.length - visibleProducts.length).toLocaleString()} left) ↓`;
  $("#favoritesCount").textContent = state.favorites.length;
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function addToCart(id) {
  const product = state.products.find(p => p.id === Number(id));
  if (!product) return;
  const existing = state.cart.find(item => item.productId === product.id);
  if (existing) {
    if (existing.quantity >= product.stock) return showToast("Sorry, maximum available stock reached.");
    existing.quantity++;
  } else {
    state.cart.push({ productId: product.id, quantity: 1 });
  }
  saveCart();
  renderCart();
  showToast(`${product.name} added to your bag.`);
}
function cartDetails() {
  return state.cart.map(item => {
    const product = state.products.find(p => p.id === item.productId);
    return product ? { ...product, quantity: item.quantity } : null;
  }).filter(Boolean);
}
function renderCart() {
  const items = cartDetails();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  $("#cartItems").innerHTML = items.length ? items.map(item => `
    <div class="cart-line">
      <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" onerror="this.onerror=null;this.style.visibility='hidden'">
      <div><h3>${escapeHTML(item.name)}</h3><p>${money(item.price)}</p><div class="qty-control"><button data-qty="${item.productId}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-qty="${item.productId}" data-delta="1" aria-label="Increase quantity">+</button></div><button class="remove-button" data-remove="${item.productId}">Remove</button></div>
      <strong>${money(item.price * item.quantity)}</strong>
    </div>`).join("") : '<div class="empty-cart"><strong>Your bag is waiting.</strong>Find something lovely to add.</div>';
  $("#cartFooter").innerHTML = items.length ? `<div class="subtotal-row"><span>Subtotal · ${items.reduce((n, i) => n + i.quantity, 0)} item(s)</span><strong>${money(total)}</strong></div><button class="primary-button full-button" id="checkoutButton">Continue to checkout <span>→</span></button><p class="demo-note">Shipping and payment are demo-only.</p>` : "";
}
function openCart() {
  $("#overlay").classList.add("show");
  $("#cartDrawer").classList.add("open");
  $("#cartDrawer").setAttribute("aria-hidden", "false");
}
function closeLayers() {
  $("#overlay").classList.remove("show");
  $("#cartDrawer").classList.remove("open");
  $("#cartDrawer").setAttribute("aria-hidden", "true");
  $$(".modal").forEach(m => m.classList.remove("show"));
}
function openModal(id) {
  closeLayers();
  $("#overlay").classList.add("show");
  $("#" + id).classList.add("show");
}
function setAuthMode(mode) {
  state.authMode = mode;
  $$(".auth-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.mode === mode));
  $("#nameLabel").classList.toggle("hidden", mode !== "register");
  $("#nameLabel input").required = mode === "register";
  $("#authTitle").innerHTML = mode === "login" ? 'Good to see you<span class="brand-dot">.</span>' : 'Join the good life<span class="brand-dot">.</span>';
  $("#authSubmit").innerHTML = (mode === "login" ? "Login" : "Create account") + " <span>→</span>";
  $("#authForm").elements.password.autocomplete = mode === "login" ? "current-password" : "new-password";
  $("#authMessage").textContent = "";
}
function refreshAccountButton() {
  $("#accountButton").textContent = state.user ? `Hi, ${state.user.name.split(" ")[0]} · Orders` : "Login / Sign up";
}
async function loadMe() {
  try {
    const result = await api("/api/me");
    state.user = result.user;
    refreshAccountButton();
  } catch { /* The store can still be browsed while logged out. */ }
}
async function showOrders() {
  try {
    const orders = await api("/api/orders");
    $("#ordersList").innerHTML = orders.length ? orders.map(order => `
      <div class="order-card"><div class="order-card-head"><span>Order #${order.id}</span><span>${money(order.total)}</span></div>
      <small>${new Date(order.createdAt).toLocaleString()}<br>${order.items.map(i => `${escapeHTML(i.name)} × ${i.quantity}`).join(" · ")}<br><span class="order-status">${escapeHTML(order.status)}</span></small></div>`).join("") : '<p class="modal-subtitle">No orders yet. Your first favourite is waiting.</p>';
    openModal("ordersModal");
  } catch (error) { showToast(error.message); }
}
function beginCheckout() {
  if (!state.cart.length) return showToast("Your cart is empty.");
  if (!state.user) {
    setAuthMode("login");
    $("#authMessage").textContent = "Please log in or create an account before checkout.";
    openModal("authModal");
    return;
  }
  $("#checkoutTotal").textContent = money(cartDetails().reduce((sum, item) => sum + item.price * item.quantity, 0));
  $("#checkoutMessage").textContent = "";
  openModal("checkoutModal");
}

function toggleFavorite(id) {
  id = Number(id);
  if (state.favorites.includes(id)) {
    state.favorites = state.favorites.filter(item => item !== id);
    showToast("Removed from favourites.");
  } else {
    state.favorites.push(id);
    showToast("Added to favourites.");
  }
  localStorage.setItem("shopnest-favorites", JSON.stringify(state.favorites));
  renderProducts();
}

$("#productGrid").addEventListener("click", async event => {
  const favorite = event.target.closest("[data-favorite]");
  if (favorite) { event.stopPropagation(); toggleFavorite(favorite.dataset.favorite); return; }
  if (event.target.closest("#browseAllButton")) {
    state.showFavorites = false;
    state.page = 1;
    state.category = "All";
    $$(".category-chip").forEach(c => c.classList.toggle("active", c.dataset.category === "All"));
    renderProducts();
    return;
  }
  const add = event.target.closest("[data-add]");
  if (add) { event.stopPropagation(); addToCart(add.dataset.add); return; }
  const details = event.target.closest("[data-details]");
  if (details) {
    const product = state.products.find(p => p.id === Number(details.dataset.details));
    if (product) {
      $("#productDetails").innerHTML = `
        <div class="product-detail-layout">
          <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" onerror="this.onerror=null;this.style.visibility='hidden';this.parentElement.classList.add('image-unavailable')">
          <div>
            <p class="eyebrow">PRODUCT DETAILS</p>
            <span class="product-detail-category">${escapeHTML(product.category)}</span>
            <h2 id="productModalTitle">${escapeHTML(product.name)}<span class="brand-dot">.</span></h2>
            <div class="product-detail-price">${money(product.price)}</div>
            <p class="product-detail-description">${escapeHTML(product.description)}</p>
            <p class="product-stock">${product.stock > 0 ? `${product.stock} in stock` : "Currently out of stock"}</p>
            <button class="primary-button full-button" data-detail-add="${product.id}" ${product.stock < 1 ? "disabled" : ""}>Add to bag <span>→</span></button>
          </div>
        </div>`;
      openModal("productModal");
    }
  }
});
$("#productDetails").addEventListener("click", event => {
  const button = event.target.closest("[data-detail-add]");
  if (!button) return;
  const id = Number(button.dataset.detailAdd);
  closeLayers();
  addToCart(id);
});

$("#productGrid").addEventListener("keydown", event => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-details]")) {
    event.preventDefault();
    const product = state.products.find(p => p.id === Number(event.target.dataset.details));
    if (product) showToast(`${product.name} · ${money(product.price)} · ${product.description}`);
  }
});
$("#loadMoreProducts").addEventListener("click", () => { state.page++; renderProducts(); });
$("#categoryRow").addEventListener("click", event => {
  const chip = event.target.closest("[data-category]");
  if (!chip) return;
  state.category = chip.dataset.category;
  state.page = 1;
  state.showFavorites = false;
  $$(".category-chip").forEach(c => c.classList.toggle("active", c === chip));
  renderProducts();
});
$("#searchInput").addEventListener("input", event => { state.search = event.target.value.trim(); state.page = 1; renderProducts(); });
$("#shopNow").addEventListener("click", () => $("#shop").scrollIntoView({ behavior: "smooth" }));
$("#cartButton").addEventListener("click", () => { renderCart(); openCart(); });
$("#accountButton").addEventListener("click", () => {
  if (state.user) showOrders();
  else { setAuthMode("login"); openModal("authModal"); }
});
$("#ordersButton").addEventListener("click", () => {
  if (state.user) showOrders();
  else {
    setAuthMode("login");
    $("#authMessage").textContent = "Log in to view your order history.";
    openModal("authModal");
  }
});
$("#favoritesButton").addEventListener("click", () => {
  state.showFavorites = !state.showFavorites;
  state.page = 1;
  state.category = "All";
  $$(".category-chip").forEach(c => c.classList.toggle("active", c.dataset.category === "All"));
  renderProducts();
  $("#shop").scrollIntoView({ behavior: "smooth" });
});
$("#cartItems").addEventListener("click", event => {
  const qty = event.target.closest("[data-qty]");
  const remove = event.target.closest("[data-remove]");
  if (qty) {
    const item = state.cart.find(i => i.productId === Number(qty.dataset.qty));
    if (!item) return;
    item.quantity += Number(qty.dataset.delta);
    const product = state.products.find(p => p.id === item.productId);
    if (item.quantity > (product?.stock || 99)) { item.quantity--; return showToast("Maximum available stock reached."); }
    if (item.quantity <= 0) state.cart = state.cart.filter(i => i.productId !== item.productId);
    saveCart(); renderCart();
  }
  if (remove) { state.cart = state.cart.filter(i => i.productId !== Number(remove.dataset.remove)); saveCart(); renderCart(); }
});
$("#cartFooter").addEventListener("click", event => { if (event.target.closest("#checkoutButton")) beginCheckout(); });
$$("[data-close]").forEach(button => button.addEventListener("click", closeLayers));
$("#overlay").addEventListener("click", closeLayers);
document.addEventListener("keydown", event => { if (event.key === "Escape") closeLayers(); });
$$(".auth-tab").forEach(tab => tab.addEventListener("click", () => setAuthMode(tab.dataset.mode)));

$("#authForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const body = { email: form.get("email"), password: form.get("password") };
  if (state.authMode === "register") body.name = form.get("name");
  const submit = $("#authSubmit");
  submit.disabled = true;
  $("#authMessage").textContent = "";
  try {
    const result = await api(state.authMode === "login" ? "/api/login" : "/api/register", { method: "POST", body });
    state.user = result.user;
    refreshAccountButton();
    closeLayers();
    event.currentTarget.reset();
    showToast(`Welcome${state.user.name ? ", " + state.user.name.split(" ")[0] : ""}!`);
    if (state.cart.length) beginCheckout();
  } catch (error) { $("#authMessage").textContent = error.message; }
  finally { submit.disabled = false; }
});

$("#checkoutForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const body = {
    customer: { fullName: form.get("fullName"), phone: form.get("phone"), address: form.get("address") },
    items: state.cart.map(item => ({ productId: item.productId, quantity: item.quantity }))
  };
  const submit = event.currentTarget.querySelector('button[type="submit"]');
  submit.disabled = true;
  $("#checkoutMessage").textContent = "";
  try {
    const result = await api("/api/orders", { method: "POST", body });
    state.cart = [];
    saveCart();
    renderCart();
    await loadProducts();
    closeLayers();
    $("#successText").textContent = `Order #${result.order.id} is confirmed for ${money(result.order.total)}. Thank you for shopping with ShopNest!`;
    openModal("successModal");
    event.currentTarget.reset();
  } catch (error) { $("#checkoutMessage").textContent = error.message; }
  finally { submit.disabled = false; }
});
$("#continueShopping").addEventListener("click", closeLayers);
$("#year").textContent = new Date().getFullYear();

(async function init() {
  renderCartCount();
  renderCart();
  await Promise.all([loadProducts(), loadMe()]);
})();