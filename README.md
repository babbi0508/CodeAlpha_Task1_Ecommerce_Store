# CodeAlpha Project 1 — Simple E-commerce Store

A responsive full-stack demo store built with HTML, CSS, JavaScript, Node.js, Express, and a persistent JSON-file data store.

## Features

- Responsive storefront with 1,000 demo products, product cards, category filters, and product search
- Load-more pagination (24 products at a time) so the page stays responsive
- 10 categories: Electronics, Fashion, Accessories, Home, Beauty, Sports, Books, Kitchen, Toys, and Office
- Product information displayed from the backend API
- Shopping cart with quantity controls, remove action, and subtotal
- User registration and login
- Password hashing with bcryptjs
- Session-based login state
- Checkout form and order processing
- Inventory checks and stock reduction after order placement
- Per-user order history
- Products, users, and orders persist in `data/store.json`

## Requirements

Install Node.js LTS from https://nodejs.org/. Then open this folder in VS Code.

## Run the project

1. Open a terminal in this project folder.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   npm start
   ```

4. Open http://localhost:3000 in your browser.

The first run creates `data/store.json` with 1,000 demo products automatically. If you already ran the earlier 6-product version, restarting this updated server adds the new catalog while preserving your users and orders.

## Test the main flow

1. Browse/search/filter products.
2. Add one or more products to the bag and adjust quantities.
3. Click Login / Sign up and create an account.
4. Enter delivery details and place a demo order.
5. Click your account name to see your order history.
6. Stop and restart the server; the saved products, users, and orders remain in `data/store.json`.

## Project structure

```text
CodeAlpha_EcommerceStore/
├── data/
│   └── store.json            # created automatically on first run
├── public/
│   ├── index.html            # page structure
│   ├── styles.css            # responsive design
│   └── app.js                # frontend logic
├── package.json
├── server.js                 # Express API, auth, orders, data storage
└── README.md
```

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/products` | List/search/filter products |
| GET | `/api/products/:id` | Get a product |
| GET | `/api/me` | Current session user |
| POST | `/api/register` | Register an account |
| POST | `/api/login` | Log in |
| POST | `/api/logout` | Log out |
| POST | `/api/orders` | Place an order (login required) |
| GET | `/api/orders` | Current user's orders (login required) |

## Important notes

- This is an internship/demo project, not a production-ready shop.
- The persistent database is a local JSON file to make setup easy; it is not MongoDB. It stores products, users, and orders in `data/store.json`.
- No real payment gateway is connected. Checkout creates a demo order only.
- Before public deployment, configure a strong `SESSION_SECRET`, use HTTPS and secure cookies, add CSRF protection, rate limiting, input validation, and migrate storage to MongoDB or a relational database.
- Product photos load from Unsplash over the internet; a fallback image appears if one fails to load.
