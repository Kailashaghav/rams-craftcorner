# 🎁 rams craftcorner — Premium Customized Gift Box Store

A production-ready, full-stack e-commerce platform for selling customized gift boxes. Built with React, Node.js/Express, and MySQL — featuring Razorpay payments, an AI gift assistant, and a full admin dashboard.

**🔴 Live Site:** https://rams-craftcorner.vercel.app
**🔴 Live API:** https://rams-craftcorner.onrender.com/api

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Redux Toolkit |
| Backend | Node.js, Express.js (MVC), REST API |
| Database | MySQL (Clever Cloud in production) |
| Auth | JWT (access + refresh tokens), bcrypt, OTP verification |
| Payments | Razorpay |
| Images | Cloudinary |
| Email | Nodemailer (Gmail SMTP) |
| AI Chatbot | Groq (Llama 3.3 70B) with live MySQL product context |
| Hosting | Vercel (frontend) + Render (backend) + Clever Cloud (database) |

---

## 📁 Project Structure

```
craft-corner/
├── backend/
│   ├── config/          # Database, Cloudinary
│   ├── controllers/     # Auth, Product, Order, Payment, Chatbot, Analytics, Category, Cart, Wishlist
│   ├── database/        # schema.sql, migrate.js, seed.js, admin scripts
│   ├── middleware/      # auth, error handling, validation
│   ├── routes/          # All API routes
│   ├── services/        # Email, WhatsApp, Shiprocket
│   ├── utils/           # JWT helpers
│   └── server.js        # Express entry point
└── frontend/
    └── src/
        ├── components/  # Navbar, Footer, ProductCard, CartDrawer, Chatbot
        ├── layouts/     # MainLayout, AdminLayout
        ├── pages/       # Home, GiftBoxes, Checkout, Orders, Admin pages...
        ├── slices/      # Redux: auth, cart, wishlist, ui, products
        ├── services/    # Axios API client with auto token refresh
        └── App.jsx       # Router
```

---

## ⚡ Local Development Setup

### Prerequisites
- Node.js 18+
- MySQL 8+ (local)
- Cloudinary account (free tier)
- Razorpay account (test mode)
- Groq API key (free) — [console.groq.com](https://console.groq.com)
- Gmail account with App Password for sending emails

### 1. Clone and Install

```bash
git clone https://github.com/Kailashaghav/rams-craftcorner.git
cd rams-craftcorner

cd backend && npm install
cd ../frontend && npm install
```

### 2. Database Setup (Local)

```bash
mysql -u root -p
CREATE DATABASE craft_corner CHARACTER SET utf8mb4;
exit
```

```bash
cd backend
node database/migrate.js
node database/seed.js        # optional — adds sample categories/products
```

### 3. Environment Variables

Copy the example files:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill in `backend/.env`:
```env
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=craft_corner

JWT_SECRET=your_random_secret
JWT_REFRESH_SECRET=your_random_refresh_secret

CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_gmail_app_password

RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx

GROQ_API_KEY=gsk_xxx
```

Fill in `frontend/.env`:
```env
VITE_API_URL=http://localhost:5001/api
```

### 4. Create Admin Account

```bash
cd backend
node database/create-admin.js
```
Default login: `admin@craftcorner.in` / `password` (change this immediately — see Admin Access section below)

### 5. Run Locally

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

| URL | Page |
|---|---|
| http://localhost:5173 | Storefront |
| http://localhost:5173/admin/login | Admin panel |
| http://localhost:5001/api/health | API health check |

---

## 🔐 Admin Access

**Live site:** https://rams-craftcorner.vercel.app/admin/login

To reset/create the admin password on any database (local or production):

1. Point `backend/.env` DB credentials at the target database
2. Edit `ADMIN_EMAIL` / `ADMIN_PASSWORD` at the top of `backend/database/reset-admin.js`
3. Run:
```bash
node database/reset-admin.js
```
4. Switch `.env` back to your local DB credentials afterward

⚠️ **Never share admin credentials.** Anyone with them has full access to products, orders, customers, and coupons. To add a teammate, create a *second* admin account with their own email rather than sharing yours.

---

## 🌐 Production Deployment

| Service | Role | Notes |
|---|---|---|
| **Vercel** | Frontend hosting | Auto-deploys on push to `main` |
| **Render** | Backend hosting (free tier) | Sleeps after 15 min idle — first request after that takes 30-50s to wake up |
| **Clever Cloud** | MySQL database (free DEV plan) | 5MB storage limit — upgrade when you outgrow it |
| **Cloudinary** | Product images | Free tier |

### Redeploying After Code Changes

```bash
git add .
git commit -m "your message"
git push
```
Both Vercel and Render auto-redeploy on push to `main`. No manual steps needed.

### Running Database Migrations on Production

The production database is **separate** from your local one. To run schema changes against it:

1. Temporarily swap `backend/.env` DB credentials to your Clever Cloud values
2. Run `node database/migrate-production.js` (uses `schema-production.sql` — no `CREATE DATABASE` statement, since free-tier hosts don't allow creating new databases)
3. Switch `.env` back to local values

### Important — Adding Products in Production

Products/categories/orders added via the **live admin panel** save directly to the production database and appear on the live storefront **instantly** — no redeploy required. Only *code* changes need a git push + redeploy.

---

## 🌍 SEO / Google Indexing

- `frontend/public/robots.txt` and `frontend/public/sitemap.xml` are configured for the production domain
- Site is verified in [Google Search Console](https://search.google.com/search-console) via URL prefix + HTML meta tag method
- Sitemap submitted for crawling
- If you change domains later, update the URLs in `index.html`, `robots.txt`, and `sitemap.xml`, then resubmit the sitemap in Search Console

---

## 🎨 Key Features

- **Custom Gift Builder** — 10-step wizard (box → chocolates → flowers → teddy → mug → card → perfume → wrap → preview → checkout)
- **AI Chatbot ("Aria")** — Groq-powered, recommends gifts by budget/occasion/relationship using live product data
- **Full Checkout Flow** — Address → delivery slot → coupon → Razorpay payment → order confirmation with email/WhatsApp notifications
- **Inventory Management** — Stock is reserved at order creation, confirmed on payment success, automatically restored if payment fails or is cancelled
- **Admin Dashboard** — Revenue charts, order management, product CRUD with image upload, customer management
- **OTP-based Auth** — Email verification and password reset both use 6-digit OTP codes (no magic links)

---

## 🐛 Common Issues & Fixes

| Issue | Fix |
|---|---|
| `mysql_native_password` CLI error on Mac | Use `node database/migrate.js` instead of the `mysql` CLI — it uses the `mysql2` npm driver which doesn't have this issue |
| `Access denied to database 'craft_corner'` on Clever Cloud | Free-tier hosts only allow your provisioned database name — use `schema-production.sql` (no `CREATE DATABASE`) and set `DB_NAME` to the exact name Clever Cloud gave you |
| Order total shows `0.00` | Fixed — all DB-derived DECIMAL values are explicitly `parseFloat()`'d before arithmetic, since `mysql2` returns them as strings by default |
| `mysqld_stmt_execute` error on product list | Fixed — `LIMIT`/`OFFSET` are inlined as validated integers instead of bound parameters (known `mysql2` prepared-statement bug) |
| Razorpay "Order amount less than minimum" | Orders now validate `total >= ₹1` server-side before reaching Razorpay, with a clear error message |
| Payment cancelled but stock stays locked | Fixed — `paymentFailure` now restores inventory and cancels the order automatically |

---

## 📄 License

Private project — All rights reserved.

---

