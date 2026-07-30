-- ============================================================
-- Craft Corner - Complete MySQL Database Schema
-- Production-ready normalized schema with foreign keys
-- ============================================================

CREATE DATABASE IF NOT EXISTS craft_corner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE craft_corner;

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  phone         VARCHAR(15),
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    VARCHAR(500),
  role          ENUM('customer','admin') DEFAULT 'customer',
  is_verified   BOOLEAN DEFAULT FALSE,
  is_blocked    BOOLEAN DEFAULT FALSE,
  otp           VARCHAR(10),
  otp_expiry    DATETIME,
  reset_token   VARCHAR(255),
  reset_expiry  DATETIME,
  refresh_token VARCHAR(500),
  last_login    DATETIME,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB;

-- ─── Admins ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    VARCHAR(500),
  permissions   JSON,
  is_active     BOOLEAN DEFAULT TRUE,
  refresh_token VARCHAR(500),
  last_login    DATETIME,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── Categories ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  image_url   VARCHAR(500),
  parent_id   INT DEFAULT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INT DEFAULT 0,
  meta_title       VARCHAR(200),
  meta_description VARCHAR(500),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_slug (slug),
  INDEX idx_parent (parent_id)
) ENGINE=InnoDB;

-- ─── Products ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  category_id      INT NOT NULL,
  name             VARCHAR(200) NOT NULL,
  slug             VARCHAR(220) NOT NULL UNIQUE,
  description      TEXT,
  short_description VARCHAR(500),
  price            DECIMAL(10,2) NOT NULL,
  sale_price       DECIMAL(10,2),
  sku              VARCHAR(100) UNIQUE,
  weight           DECIMAL(8,2),
  dimensions       JSON,
  tags             JSON,
  occasion         VARCHAR(100),
  is_featured      BOOLEAN DEFAULT FALSE,
  is_customizable  BOOLEAN DEFAULT FALSE,
  is_active        BOOLEAN DEFAULT TRUE,
  meta_title       VARCHAR(200),
  meta_description VARCHAR(500),
  avg_rating       DECIMAL(3,2) DEFAULT 0.00,
  review_count     INT DEFAULT 0,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_slug (slug),
  INDEX idx_category (category_id),
  INDEX idx_featured (is_featured),
  INDEX idx_occasion (occasion),
  FULLTEXT idx_search (name, description)
) ENGINE=InnoDB;

-- ─── Product Images ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  product_id   INT NOT NULL,
  image_url    VARCHAR(500) NOT NULL,
  public_id    VARCHAR(200),
  alt_text     VARCHAR(200),
  is_primary   BOOLEAN DEFAULT FALSE,
  sort_order   INT DEFAULT 0,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product (product_id)
) ENGINE=InnoDB;

-- ─── Inventory ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  product_id        INT NOT NULL UNIQUE,
  quantity          INT DEFAULT 0,
  reserved_quantity INT DEFAULT 0,
  low_stock_alert   INT DEFAULT 10,
  track_quantity    BOOLEAN DEFAULT TRUE,
  allow_backorder   BOOLEAN DEFAULT FALSE,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Addresses ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS addresses (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  label        VARCHAR(50) DEFAULT 'Home',
  full_name    VARCHAR(100) NOT NULL,
  phone        VARCHAR(15) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city         VARCHAR(100) NOT NULL,
  state        VARCHAR(100) NOT NULL,
  pincode      VARCHAR(10) NOT NULL,
  country      VARCHAR(50) DEFAULT 'India',
  is_default   BOOLEAN DEFAULT FALSE,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ─── Coupons ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  code             VARCHAR(50) NOT NULL UNIQUE,
  type             ENUM('percentage','fixed','free_shipping') NOT NULL,
  value            DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount     DECIMAL(10,2),
  usage_limit      INT,
  used_count       INT DEFAULT 0,
  per_user_limit   INT DEFAULT 1,
  is_active        BOOLEAN DEFAULT TRUE,
  valid_from       DATETIME NOT NULL,
  valid_until      DATETIME NOT NULL,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code)
) ENGINE=InnoDB;

-- ─── Cart ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  product_id   INT NOT NULL,
  quantity     INT NOT NULL DEFAULT 1,
  saved_for_later BOOLEAN DEFAULT FALSE,
  custom_box_id INT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cart_item (user_id, product_id, custom_box_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ─── Wishlist ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_wishlist (user_id, product_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ─── Delivery Slots ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_slots (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  label      VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  is_active  BOOLEAN DEFAULT TRUE,
  extra_charge DECIMAL(8,2) DEFAULT 0
) ENGINE=InnoDB;

-- ─── Orders ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  order_number      VARCHAR(50) NOT NULL UNIQUE,
  status            ENUM('pending','confirmed','packed','shipped','delivered','cancelled','returned','refunded') DEFAULT 'pending',
  address_id        INT NOT NULL,
  coupon_id         INT,
  delivery_slot_id  INT,
  subtotal          DECIMAL(10,2) NOT NULL,
  discount          DECIMAL(10,2) DEFAULT 0,
  tax               DECIMAL(10,2) DEFAULT 0,
  shipping_charge   DECIMAL(10,2) DEFAULT 0,
  total             DECIMAL(10,2) NOT NULL,
  gift_message      TEXT,
  delivery_date     DATE,
  notes             TEXT,
  invoice_url       VARCHAR(500),
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE RESTRICT,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,
  FOREIGN KEY (delivery_slot_id) REFERENCES delivery_slots(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_order_number (order_number)
) ENGINE=InnoDB;

-- ─── Order Items ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  order_id     INT NOT NULL,
  product_id   INT NOT NULL,
  custom_box_id INT,
  product_name VARCHAR(200) NOT NULL,
  product_image VARCHAR(500),
  quantity     INT NOT NULL,
  unit_price   DECIMAL(10,2) NOT NULL,
  total_price  DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_order (order_id)
) ENGINE=InnoDB;

-- ─── Payments ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  order_id               INT NOT NULL,
  user_id                INT NOT NULL,
  razorpay_order_id      VARCHAR(100),
  razorpay_payment_id    VARCHAR(100),
  razorpay_signature     VARCHAR(500),
  amount                 DECIMAL(10,2) NOT NULL,
  currency               VARCHAR(10) DEFAULT 'INR',
  method                 VARCHAR(50),
  status                 ENUM('created','attempted','captured','failed','refunded') DEFAULT 'created',
  refund_id              VARCHAR(100),
  refund_amount          DECIMAL(10,2),
  refund_reason          TEXT,
  refunded_at            DATETIME,
  created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_order (order_id),
  INDEX idx_razorpay_order (razorpay_order_id)
) ENGINE=InnoDB;

-- ─── Shipping ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipping (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  order_id             INT NOT NULL UNIQUE,
  shiprocket_order_id  VARCHAR(100),
  awb_code             VARCHAR(100),
  courier_name         VARCHAR(100),
  courier_id           INT,
  tracking_url         VARCHAR(500),
  status               VARCHAR(100),
  estimated_delivery   DATE,
  shipped_at           DATETIME,
  delivered_at         DATETIME,
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Reviews ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  product_id   INT NOT NULL,
  user_id      INT NOT NULL,
  order_id     INT,
  rating       TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title        VARCHAR(200),
  comment      TEXT,
  images       JSON,
  is_verified  BOOLEAN DEFAULT FALSE,
  is_approved  BOOLEAN DEFAULT FALSE,
  helpful_count INT DEFAULT 0,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_review (user_id, product_id, order_id),
  INDEX idx_product (product_id)
) ENGINE=InnoDB;

-- ─── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT,
  type       VARCHAR(50) NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    TEXT NOT NULL,
  data       JSON,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ─── Contact Messages ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  phone      VARCHAR(15),
  subject    VARCHAR(200),
  message    TEXT NOT NULL,
  status     ENUM('new','in_progress','resolved') DEFAULT 'new',
  replied_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── Chat Messages (AI Chatbot history) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT,
  session_id VARCHAR(100) NOT NULL,
  role       ENUM('user','assistant') NOT NULL,
  content    TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_session (session_id)
) ENGINE=InnoDB;

-- ─── Custom Boxes ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_boxes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  name         VARCHAR(200),
  total_price  DECIMAL(10,2) DEFAULT 0,
  status       ENUM('draft','saved','ordered') DEFAULT 'draft',
  preview_url  VARCHAR(500),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Gift Items (items inside a custom box) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS gift_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  custom_box_id INT NOT NULL,
  product_id    INT,
  item_type     ENUM('box','chocolate','flower','teddy','mug','card','perfume','wrap','addon') NOT NULL,
  item_name     VARCHAR(200) NOT NULL,
  item_price    DECIMAL(10,2) NOT NULL,
  quantity      INT DEFAULT 1,
  options       JSON,
  FOREIGN KEY (custom_box_id) REFERENCES custom_boxes(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── Newsletter Subscribers ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(150) NOT NULL UNIQUE,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── Coupon Usage Tracking ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupon_usage (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  coupon_id  INT NOT NULL,
  user_id    INT NOT NULL,
  order_id   INT NOT NULL,
  used_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Delivery Slots Seed Data ─────────────────────────────────────────────────
INSERT IGNORE INTO delivery_slots (label, start_time, end_time, extra_charge) VALUES
  ('Morning (8AM – 12PM)', '08:00:00', '12:00:00', 0),
  ('Afternoon (12PM – 4PM)', '12:00:00', '16:00:00', 0),
  ('Evening (4PM – 8PM)', '16:00:00', '20:00:00', 50),
  ('Midnight Surprise (10PM – 12AM)', '22:00:00', '23:59:00', 199);
