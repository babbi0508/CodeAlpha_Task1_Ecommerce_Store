const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "store.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const starterProducts = [
  { id: 1, name: "Wireless Headphones", category: "Electronics", price: 1499, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80", description: "Comfortable wireless headphones with clear sound and a long-lasting battery.", stock: 25 },
  { id: 2, name: "Smart Watch", category: "Electronics", price: 2199, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80", description: "A stylish everyday watch to complement your active lifestyle.", stock: 18 },
  { id: 3, name: "Everyday Backpack", category: "Accessories", price: 999, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80", description: "A lightweight backpack with room for your everyday essentials.", stock: 30 },
  { id: 4, name: "Running Shoes", category: "Fashion", price: 1799, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80", description: "Versatile sports shoes designed for comfort on daily walks and runs.", stock: 14 },
  { id: 5, name: "Ceramic Coffee Mug", category: "Home", price: 349, image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80", description: "A minimal ceramic mug for your morning coffee or evening tea.", stock: 40 },
  { id: 6, name: "Desk Lamp", category: "Home", price: 799, image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80", description: "A modern desk lamp for reading, studying, and working.", stock: 20 }
];

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { products: starterProducts, users: [], orders: [], nextOrderId: 1 };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    db.products ||= starterProducts;
    db.users ||= [];
    db.orders ||= [];
    db.nextOrderId ||= 1;
    return db;
  } catch {
    throw new Error("data/store.json is not valid JSON. Restore it from the project ZIP or fix the file.");
  }
}
function writeDB(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "replace-this-secret-before-deployment",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 4 }
}));
app.use(express.static(path.join(__dirname, "public")));

function currentUser(req) {
  if (!req.session.userId) return null;
  const db = readDB();
  const user = db.users.find(u => u.id === req.session.userId);
  return user ? { id: user.id, name: user.name, email: user.email } : null;
}
function requireLogin(req, res, next) {
  if (!currentUser(req)) return res.status(401).json({ error: "Please log in to continue." });
  next();
}

app.get("/api/products", (req, res) => {
  const db = readDB();
  const search = String(req.query.search || "").toLowerCase();
  const category = String(req.query.category || "");
  const products = db.products.filter(p =>
    (!search || (p.name + " " + p.description + " " + p.category).toLowerCase().includes(search)) &&
    (!category || category === "All" || p.category === category)
  );
  res.json(products);
});

app.get("/api/products/:id", (req, res) => {
  const product = readDB().products.find(p => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Product not found." });
  res.json(product);
});

app.get("/api/me", (req, res) => res.json({ user: currentUser(req) }));

app.post("/api/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (name.length < 2) return res.status(400).json({ error: "Please enter your name (at least 2 characters)." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });
  const db = readDB();
  if (db.users.some(u => u.email === email)) return res.status(409).json({ error: "An account with this email already exists. Please log in." });
  const user = { id: "u_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7), name, email, passwordHash: await bcrypt.hash(password, 10) };
  db.users.push(user);
  writeDB(db);
  req.session.userId = user.id;
  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } });
});

app.post("/api/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const db = readDB();
  const user = db.users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: "Incorrect email or password." });
  req.session.userId = user.id;
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ message: "Logged out." }));
});

app.post("/api/orders", requireLogin, (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const customer = req.body.customer || {};
  const fullName = String(customer.fullName || "").trim();
  const address = String(customer.address || "").trim();
  const phone = String(customer.phone || "").trim();
  if (!items.length) return res.status(400).json({ error: "Your cart is empty." });
  if (fullName.length < 2 || address.length < 8 || phone.length < 8) {
    return res.status(400).json({ error: "Please enter your full name, complete address, and phone number." });
  }
  const db = readDB();
  const normalized = [];
  for (const item of items) {
    const product = db.products.find(p => p.id === Number(item.productId));
    const quantity = Math.floor(Number(item.quantity));
    if (!product || !Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      return res.status(400).json({ error: "One of the cart items is invalid. Please refresh and try again." });
    }
    if (quantity > product.stock) return res.status(400).json({ error: `${product.name} has only ${product.stock} item(s) in stock.` });
    normalized.push({ productId: product.id, name: product.name, price: product.price, quantity, image: product.image });
  }
  for (const item of normalized) {
    const product = db.products.find(p => p.id === item.productId);
    product.stock -= item.quantity;
  }
  const total = normalized.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const user = currentUser(req);
  const order = {
    id: db.nextOrderId++,
    userId: user.id,
    customer: { fullName, address, phone },
    items: normalized,
    total,
    status: "Confirmed",
    createdAt: new Date().toISOString()
  };
  db.orders.push(order);
  writeDB(db);
  res.status(201).json({ order });
});

app.get("/api/orders", requireLogin, (req, res) => {
  const user = currentUser(req);
  const orders = readDB().orders.filter(o => o.userId === user.id).sort((a, b) => b.id - a.id);
  res.json(orders);
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => {
  readDB();
  console.log(`\nCodeAlpha E-commerce Store is running at http://localhost:${PORT}`);
  console.log("Press Ctrl+C to stop the server.\n");
});