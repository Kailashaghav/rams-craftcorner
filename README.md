# 🎁 Craft Corner — Premium Customized Gift Box Store

A production-ready, enterprise-grade, AI-powered e-commerce platform for selling customized gift boxes. Built with the MERN stack (MySQL instead of MongoDB), featuring Razorpay payments, Shiprocket shipping, OpenAI chatbot, WhatsApp notifications, and a full admin dashboard.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Redux Toolkit |
| Backend | Node.js, Express.js (MVC), REST API |
| Database | MySQL (normalized schema, 20+ tables) |
| Auth | JWT (access + refresh tokens), bcrypt, OTP |
| Payments | Razorpay (create order → verify → refund) |
| Shipping | Shiprocket (create shipment, AWB, tracking) |
| Images | Cloudinary (multi-image, compression) |
| Email | Nodemailer (welcome, OTP, order confirmation) |
| WhatsApp | Meta WhatsApp Business API |
| AI Chatbot | OpenAI GPT-4o-mini with MySQL product context |

---

## 📁 Project Structure

```
craft-corner/
├── backend/
│   ├── config/          # DB, Cloudinary
│   ├── controllers/     # Auth, Product, Order, Payment, Chatbot, Analytics
│   ├── database/        # schema.sql, migrate.js
│   ├── middleware/      # auth, error, validation
│   ├── routes/          # All API routes
│   ├── services/        # Email, WhatsApp, Shiprocket
│   ├── utils/           # JWT helpers
│   └── server.js        # Express entry point
└── frontend/
    └── src/
        ├── components/  # Navbar, Footer, ProductCard, CartDrawer, Chatbot
        ├── layouts/     # MainLayout, AdminLayout
        ├── pages/       # All pages (Home, GiftBoxes, Checkout, Admin...)
        ├── slices/      # Redux: auth, cart, wishlist, ui, products
        ├── services/    # Axios API with auto token refresh
        └── App.jsx      # Router with protected/guest routes
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8+
- Cloudinary account
- Razorpay account
- OpenAI API key

### 1. Database Setup

```bash
mysql -u root -p
CREATE DATABASE craft_corner;
exit
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in all values in .env

npm install
node database/migrate.js     # Creates all tables
node database/seed.js        # Seeds sample data (optional)
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api

npm install
npm run dev
```

### 4. Access the App

| URL | Description |
|---|---|
| http://localhost:5173 | Customer storefront |
| http://localhost:5173/admin | Admin dashboard |
| http://localhost:5000/api/health | API health check |

---

## 🔑 Environment Variables

### Backend (.env)

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=craft_corner

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=app_password

RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx

SHIPROCKET_EMAIL=you@email.com
SHIPROCKET_PASSWORD=your_password

OPENAI_API_KEY=sk-xxx

WHATSAPP_TOKEN=your_token
WHATSAPP_PHONE_ID=your_phone_id
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register new customer |
| POST | /api/auth/verify-otp | Verify email OTP |
| POST | /api/auth/login | Customer login |
| POST | /api/auth/admin/login | Admin login |
| POST | /api/auth/refresh-token | Refresh JWT |
| POST | /api/auth/forgot-password | Send reset email |
| POST | /api/auth/reset-password | Reset password |
| GET  | /api/auth/profile | Get current user |
| POST | /api/auth/logout | Logout |

### Products
| Method | Endpoint | Description |
|---|---|---|
| GET  | /api/products | List with search/filter/sort/pagination |
| GET  | /api/products/featured | Featured products |
| GET  | /api/products/:slug | Single product with images, reviews, related |
| POST | /api/products | Create (Admin) |
| PUT  | /api/products/:id | Update (Admin) |
| DELETE | /api/products/:id | Delete (Admin) |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/orders | Create order from cart |
| GET  | /api/orders/my-orders | User's orders |
| GET  | /api/orders/:id | Order details |
| POST | /api/orders/:id/cancel | Cancel order |
| PATCH | /api/orders/:id/status | Update status (Admin) |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/payments/create-order | Create Razorpay order |
| POST | /api/payments/verify | Verify payment signature |
| POST | /api/payments/failure | Record failure |
| POST | /api/payments/refund | Initiate refund (Admin) |

### Chatbot
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/chatbot/chat | Chat with AI (Aria) |
| GET  | /api/chatbot/history/:sessionId | Get chat history |

---

## 🎨 UI Features

- **Luxury theme**: Rose pink + white + gold color palette
- **Glassmorphism** cards and overlays
- **Smooth animations** via Framer Motion (page transitions, hover effects, floating elements)
- **Dark mode** toggle (persisted in localStorage)
- **Responsive mobile-first** design
- **Skeleton loaders** for all async content
- **Toast notifications** via react-hot-toast

---

## 🎁 Custom Gift Builder

10-step wizard allowing customers to:
1. Choose Gift Box (4 styles)
2. Add Chocolates (optional)
3. Add Flowers (optional)
4. Add Teddy Bear (optional)
5. Add Personalised Mug (optional)
6. Add Greeting Card (optional)
7. Add Perfume/Cologne (optional)
8. Choose Gift Wrap
9. Preview all selections
10. Checkout with dynamic total

---

## 🤖 AI Chatbot (Aria)

- Floating chat widget (bottom-right)
- Powered by OpenAI GPT-4o-mini
- Product context pulled live from MySQL
- Session-based conversation history stored in DB
- Quick prompt suggestions
- Typing indicators and smooth animations
- Recommends by budget, occasion, relationship, age, gender

---

## 🚀 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy dist/ to Vercel
```

### Backend → Railway / Render
```bash
# Set all environment variables on Railway
# Deploy backend/ folder
# Railway auto-detects package.json
```

### Database → PlanetScale / Railway MySQL
```
# Create MySQL database on PlanetScale or Railway
# Run migration script pointing to cloud DB
```

---

## 📦 Key Dependencies

### Backend
- `express` – web framework
- `mysql2` – MySQL with promise support
- `jsonwebtoken` + `bcryptjs` – auth
- `razorpay` – payments
- `cloudinary` + `multer-storage-cloudinary` – image upload
- `nodemailer` – email
- `openai` – AI chatbot
- `axios` – Shiprocket & WhatsApp API calls
- `helmet` + `express-rate-limit` – security

### Frontend
- `react` + `vite` – modern build setup
- `@reduxjs/toolkit` + `react-redux` – state management
- `react-router-dom` v6 – routing
- `framer-motion` – animations
- `tailwindcss` – styling
- `react-hook-form` – form handling
- `recharts` – admin charts
- `axios` – HTTP client with interceptors
- `react-hot-toast` – notifications
- `lucide-react` – icons

---

## 🛡 Security Features

- Helmet.js security headers
- CORS with whitelist
- Rate limiting (global + auth endpoints)
- JWT with short-lived access tokens + refresh rotation
- bcrypt password hashing (rounds: 12)
- express-validator input validation
- SQL parameterized queries (no raw interpolation)
- XSS protection via input sanitization
- CSRF protection via SameSite cookies

---

## 📄 License

MIT License — Built for Craft Corner India
