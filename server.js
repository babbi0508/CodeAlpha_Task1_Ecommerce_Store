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

// A 1,000-item demo catalog. Product photos are representative category images
// from Unsplash; photos repeat across variants so the page stays lightweight.
const catalogGroups = [
  { category: "Electronics", types: ["Laptop", "Gaming Laptop", "Business Laptop", "Smartphone", "Android Phone", "iPhone Style Phone", "Tablet", "Bluetooth Speaker", "Wireless Earbuds", "Over-Ear Headphones", "Smart Watch", "Gaming Mouse", "Mechanical Keyboard", "Power Bank", "USB-C Charger", "Portable SSD", "Webcam", "Gaming Controller", "Monitor", "Wi-Fi Router"], images: ["photo-1496181133206-80ce9b88a853", "photo-1511709679914-4c6e5c8d0b5d", "photo-1523275335684-37898b6baf30", "photo-1505740420928-5e560c06d30e", "photo-1527814050087-3793815479db"] },
  { category: "Fashion", types: ["Everyday T-Shirt", "Casual Hoodie", "Denim Jacket", "Running Shoes", "Classic Sneakers", "Summer Dress", "Evening Dress", "Floral Dress", "Cotton Shirt", "Formal Shirt", "Relaxed Trousers", "Knit Sweater", "Sport Shorts", "Jeans", "Ethnic Kurta", "Saree", "Leggings", "Winter Coat", "Party Wear Top", "Casual Skirt"], images: ["photo-1542291026-7eec264c27ff", "photo-1529139574466-a303027c1d8b", "photo-1483985988355-763728e1935b", "photo-1490481651871-ab68de25d43d", "photo-1515886657613-9f3515b0c78f"] },
  { category: "Accessories", types: ["Everyday Backpack", "Crossbody Bag", "Leather Wallet", "Travel Pouch", "Sunglasses", "Classic Belt", "Canvas Tote", "Card Holder", "Travel Organizer", "Minimal Watch", "Gold-Tone Earrings", "Silver Necklace", "Bracelet Set", "Hair Clips", "Fashion Ring", "Travel Duffel Bag", "Laptop Bag", "Keychain", "Scarf", "Baseball Cap"], images: ["photo-1553062407-98eeb64c6a62", "photo-1548036328-c9fa89d128fa", "photo-1523170335258-f5ed11844a49", "photo-1584917865442-de89df76afd3", "photo-1511499767150-a48a237f0083"] },
  { category: "Home", types: ["Ceramic Coffee Mug", "Desk Lamp", "Throw Pillow", "Decorative Vase", "Wall Clock", "Scented Candle", "Soft Throw Blanket", "Table Planter", "Storage Basket", "Photo Frame", "Bed Sheet Set", "Comforter", "Curtain Pair", "Floor Rug", "Sofa Cover", "Laundry Basket", "Full-Length Mirror", "Table Lamp", "Wall Art Print", "Storage Shelf"], images: ["photo-1514228742587-6b1558fcca3d", "photo-1507473885765-e6ed057f782c", "photo-1616486338812-3dadae4b4ace", "photo-1618221195710-dd6b41faaea6", "photo-1494438639946-1ebd1d20bf85"] },
  { category: "Beauty", types: ["Face Moisturizer", "Gentle Cleanser", "Lip Balm Set", "Hair Brush", "Makeup Pouch", "Body Lotion", "Facial Roller", "Travel Mirror", "Nail Care Kit", "Hair Serum", "Floral Perfume", "Men's Perfume", "Women's Perfume", "Unisex Eau de Parfum", "Deodorant Spray", "Shampoo", "Conditioner", "Sunscreen SPF 50", "Lipstick", "Mascara"], images: ["photo-1608248543803-ba4f8c70ae0b", "photo-1596462502278-27bfdc403348", "photo-1522335789203-aabd1fc54bc9", "photo-1556229010-6c3f2c9ca5f8", "photo-1571781926291-c477ebfd024b"] },
  { category: "Sports", types: ["Yoga Mat", "Water Bottle", "Resistance Bands", "Gym Gloves", "Skipping Rope", "Sports Towel", "Training Ball", "Running Belt", "Fitness Roller", "Workout Bag", "Dumbbell Set", "Cricket Bat", "Football", "Badminton Racket", "Cycling Helmet", "Tennis Racket", "Camping Tent", "Hiking Shoes", "Sports Jersey", "Exercise Bench"], images: ["photo-1518611012118-696072aa579a", "photo-1526401485004-2aa7f3b8a3b4", "photo-1534438327276-14e5300c3a48", "photo-1571019613454-1cb2f99b2d8b", "photo-1517836357463-d25dfeac3438"] },
  { category: "Books", types: ["Daily Journal", "Notebook Set", "Sketchbook", "Planner Book", "Classic Novel", "Study Notebook", "Travel Journal", "Recipe Book", "Reading Light", "Book Sleeve", "Science Textbook", "Programming Book", "Fantasy Novel", "Self-Help Book", "Biography", "Exam Preparation Guide", "Children's Storybook", "Poetry Collection", "Cookbook", "Language Learning Book"], images: ["photo-1544947950-fa07a98d237f", "photo-1455390582262-044c37b1e8f0", "photo-1519682337058-a94d519337bc", "photo-1456513080510-7bf3a84b82f8", "photo-1516979187457-637abb4f9353"] },
  { category: "Kitchen", types: ["Stainless Water Bottle", "Meal Prep Container", "Wooden Cutting Board", "Kitchen Tongs", "Glass Storage Jar", "Silicone Spatula", "Lunch Box", "Measuring Cup Set", "Tea Infuser", "Reusable Food Wrap", "Air Fryer", "Mixer Grinder", "Electric Kettle", "Coffee Maker", "Rice Cooker", "Nonstick Pan", "Pressure Cooker", "Dinner Set", "Toaster", "Food Chopper"], images: ["photo-1495546968767-f0573cca821e", "photo-1556911220-bff31c812dba", "photo-1556909114-f6e7ad7d3136", "photo-1547592180-85f173990554", "photo-1606787366850-de6330128bfc"] },
  { category: "Toys", types: ["Building Block Set", "Plush Teddy Bear", "Puzzle Game", "Wooden Toy Car", "Art Kit", "Board Game", "Mini Robot Toy", "Dinosaur Figure", "Kids Water Bottle", "Coloring Set", "Remote Control Car", "Doll House", "Toy Train Set", "Science Experiment Kit", "Kids Bicycle", "Musical Keyboard Toy", "Soft Baby Toy", "Play Tent", "Action Figure", "Magnetic Tiles"], images: ["photo-1558877385-81a1e7eec6e1", "photo-1559454403-b8fb88521f11", "photo-1587654780291-39c9404d746b", "photo-1560961911-ba7ef651a56c", "photo-1599623560574-39d485900c95"] },
  { category: "Office", types: ["Desk Organizer", "Ballpoint Pen Set", "Laptop Stand", "Sticky Note Set", "File Folder Set", "Ergonomic Mouse Pad", "Cable Organizer", "Document Holder", "Pen Cup", "Whiteboard Planner", "Office Chair", "Computer Desk", "Printer", "Desk Mat", "Paper Shredder", "Filing Cabinet", "USB Flash Drive", "Presentation Remote", "Calculator", "Monitor Stand"], images: ["photo-1498050108023-c5249f4df085", "photo-1499951360447-b19be8fe80f5", "photo-1516321318423-f06f85e504b3", "photo-1519389950473-47ba0277781c", "photo-1455390582262-044c37b1e8f0"] }
];

// Use different image IDs for different product types. Variants of the same
// product can share a representative photo, but unrelated products should not.
function imageForProduct(category, type, typeIndex = 0) {
  const name = type.toLowerCase();
  const choose = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;
  const imageSets = [
    [/laptop|computer desk|monitor stand|laptop stand|portable ssd|printer|webcam|monitor/, ["photo-1496181133206-80ce9b88a853", "photo-1519389950473-47ba0277781c"]],
    [/phone|smartphone|iphone|android phone/, ["photo-1511709679914-4c6e5c8d0b5d", "photo-1598327105666-5b89351aff97"]],
    [/tablet/, ["photo-1544244015-0df4b3ffc6b0"]],
    [/headphone|earbud|speaker/, ["photo-1505740420928-5e560c06d30e", "photo-1608043152269-423dbba4e7e1"]],
    [/watch/, ["photo-1523275335684-37898b6baf30", "photo-1524805444758-089113d48a6d"]],
    [/mouse|keyboard|controller|router|charger|power bank|usb/, ["photo-1527814050087-3793815479db", "photo-1587829741301-dc798b83add3"]],
    [/t-shirt|shirt|hoodie|sweater|jersey|top|shorts|trousers|jeans|leggings|coat|jacket|skirt|kurta|saree|dress|clothing/, ["photo-1521572163474-6864f9cf17ab", "photo-1529139574466-a303027c1d8b", "photo-1490481651871-ab68de25d43d", "photo-1515886657613-9f3515b0c78f"]],
    [/shoe|sneaker|hiking/, ["photo-1542291026-7eec264c27ff", "photo-1543163521-1bf539c55dd2"]],
    [/perfume|eau de parfum|deodorant|fragrance/, ["photo-1594035910387-fea47794261f", "photo-1596462502278-27bfdc403348"]],
    [/moisturizer|cleanser|lip balm|lotion|serum|sunscreen|lipstick|mascara|shampoo|conditioner|makeup|beauty|nail care|facial roller/, ["photo-1608248543803-ba4f8c70ae0b", "photo-1596462502278-27bfdc403348", "photo-1522335789203-aabd1fc54bc9"]],
    [/backpack|travel duffel|duffel bag|laptop bag|crossbody bag|tote|bag|wallet|pouch|card holder|organizer/, ["photo-1553062407-98eeb64c6a62", "photo-1548036328-c9fa89d128fa", "photo-1584917865442-de89df76afd3"]],
    [/sunglasses|glasses/, ["photo-1511499767150-a48a237f0083"]],
    [/necklace|earring|bracelet|fashion ring|hair clip|scarf|baseball cap|keychain|belt/, ["photo-1611652022419-a9419f74343d", "photo-1535632066927-ab7c9ab60908", "photo-1573408301185-9146fe634ad0"]],
    [/mug|coffee maker|kettle|rice cooker|air fryer|pan|pressure cooker|toaster|cutting board|lunch box|food chopper|dinner set|spatula|tongs|measuring cup|storage jar/, ["photo-1514228742587-6b1558fcca3d", "photo-1556911220-bff31c812dba", "photo-1495546968767-f0573cca821e"]],
    [/desk lamp|table lamp|lamp|light/, ["photo-1507473885765-e6ed057f782c"]],
    [/book|novel|notebook|journal|textbook|cookbook|planner|sketchbook/, ["photo-1544947950-fa07a98d237f", "photo-1455390582262-044c37b1e8f0", "photo-1519682337058-a94d519337bc"]],
    [/yoga|dumbbell|gym|fitness|exercise|resistance band|skipping rope|cricket|football|badminton|tennis racket|cycling helmet|camping tent|water bottle/, ["photo-1517836357463-d25dfeac3438", "photo-1518611012118-696072aa579a", "photo-1534438327276-14e5300c3a48"]],
    [/toy|teddy|puzzle|doll|building block|dinosaur|kids bicycle|train set|action figure/, ["photo-1558877385-81a1e7eec6e1", "photo-1559454403-b8fb88521f11", "photo-1587654780291-39c9404d746b"]],
    [/pillow|vase|clock|candle|blanket|planter|basket|photo frame|bed sheet|comforter|curtain|rug|sofa|mirror|wall art|shelf|storage/, ["photo-1616486338812-3dadae4b4ace", "photo-1618221195710-dd6b41faaea6", "photo-1494438639946-1ebd1d20bf85"]],
    [/pen|sticky note|folder|office chair|calculator|whiteboard|document holder|paper shredder|filing cabinet|desk organizer/, ["photo-1499951360447-b19be8fe80f5", "photo-1498050108023-c5249f4df085"]]
  ];
  for (const [pattern, ids] of imageSets) {
    if (pattern.test(name)) return choose(ids[typeIndex % ids.length]);
  }
  const categoryPools = {
    Electronics: ["photo-1496181133206-80ce9b88a853", "photo-1511709679914-4c6e5c8d0b5d", "photo-1523275335684-37898b6baf30", "photo-1505740420928-5e560c06d30e", "photo-1527814050087-3793815479db"],
    Fashion: ["photo-1529139574466-a303027c1d8b", "photo-1483985988355-763728e1935b", "photo-1490481651871-ab68de25d43d", "photo-1515886657613-9f3515b0c78f", "photo-1521572163474-6864f9cf17ab"],
    Accessories: ["photo-1553062407-98eeb64c6a62", "photo-1548036328-c9fa89d128fa", "photo-1523170335258-f5ed11844a49", "photo-1584917865442-de89df76afd3", "photo-1511499767150-a48a237f0083"],
    Home: ["photo-1514228742587-6b1558fcca3d", "photo-1507473885765-e6ed057f782c", "photo-1616486338812-3dadae4b4ace", "photo-1618221195710-dd6b41faaea6", "photo-1494438639946-1ebd1d20bf85"],
    Beauty: ["photo-1608248543803-ba4f8c70ae0b", "photo-1596462502278-27bfdc403348", "photo-1522335789203-aabd1fc54bc9", "photo-1556229010-6c3f2c9ca5f8", "photo-1594035910387-fea47794261f"],
    Sports: ["photo-1518611012118-696072aa579a", "photo-1534438327276-14e5300c3a48", "photo-1571019613454-1cb2f99b2d1b", "photo-1517836357463-d25dfeac3438", "photo-1542291026-7eec264c27ff"],
    Books: ["photo-1544947950-fa07a98d237f", "photo-1455390582262-044c37b1e8f0", "photo-1519682337058-a94d519337bc", "photo-1456513080510-7bf3a84b82f8", "photo-1516979187457-637abb4f9353"],
    Kitchen: ["photo-1495546968767-f0573cca821e", "photo-1556911220-bff31c812dba", "photo-1556909114-f6e7ad7d3136", "photo-1547592180-85f173990554", "photo-1606787366850-de6330128bfc"],
    Toys: ["photo-1558877385-81a1e7eec6e1", "photo-1559454403-b8fb88521f11", "photo-1587654780291-39c9404d746b", "photo-1560961911-ba7ef651a56c", "photo-1599623560574-39d485900c95"],
    Office: ["photo-1498050108023-c5249f4df085", "photo-1499951360447-b19be8fe80f5", "photo-1516321318423-f06f85e504b3", "photo-1519389950473-47ba0277781c", "photo-1455390582262-044c37b1e8f0"]
  };
  const pool = categoryPools[category] || categoryPools.Fashion;
  return choose(pool[typeIndex % pool.length]);
}

const productVariants = ["Classic", "Modern", "Premium", "Compact", "Everyday"];
function buildCatalog() {
  const products = [...starterProducts];
  let id = 7;
  // Build a broad 1,000-item catalog with searchable laptops, phones, perfumes,
  // dresses, appliances, accessories, and many other everyday product types.
  for (let variantIndex = 0; variantIndex < productVariants.length && id <= 1000; variantIndex++) {
    for (let typeIndex = 0; typeIndex < 20 && id <= 1000; typeIndex++) {
      for (const group of catalogGroups) {
        if (id > 1000) break;
        const type = group.types[typeIndex];
        const variant = productVariants[variantIndex];
        const imageUrl = imageForProduct(group.category, type, typeIndex);
        const price = 299 + ((id * 137) % 95000);
        products.push({
          id,
          name: `${variant} ${type}`,
          category: group.category,
          price,
          image: imageUrl,
          description: `${variant} ${type.toLowerCase()} with a useful everyday design. Browse this ${group.category.toLowerCase()} product in the ShopNest demo store.`,
          stock: 5 + ((id * 7) % 46)
        });
        id++;
      }
    }
  }
  return products.slice(0, 1000);
}
const fullCatalog = buildCatalog();

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { products: fullCatalog, users: [], orders: [], nextOrderId: 1 };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    db.products ||= [];
    // Upgrade existing installs from the original 6-product version without
    // deleting saved accounts, orders, stock changes, or existing product data.
    const existingById = new Map(db.products.map(product => [Number(product.id), product]));
    let catalogChanged = false;
    for (const product of fullCatalog) {
      const existing = existingById.get(Number(product.id));
      if (!existing) {
        db.products.push(product);
        catalogChanged = true;
      } else if (existing.name !== product.name || existing.category !== product.category || existing.image !== product.image || existing.description !== product.description || existing.price !== product.price) {
        // Refresh demo catalog details so searches like “laptop”, “phone”,
        // “perfume”, and “dress” work after updating an existing installation.
        const currentStock = existing.stock;
        Object.assign(existing, product);
        existing.stock = currentStock ?? product.stock;
        catalogChanged = true;
      }
    }
    if (catalogChanged) writeDB(db);
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