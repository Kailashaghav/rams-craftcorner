/**
 * Database Seed Script
 * Seeds categories so you can add products immediately
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'craft_corner',
  });

  try {
    console.log('🌱 Seeding database...');

    // ─── Categories ───────────────────────────────────────────────────────────
    const categories = [
      { name: 'Birthday Gifts',    slug: 'birthday-gifts',    description: 'Perfect gifts for birthdays' },
      { name: 'Anniversary Gifts', slug: 'anniversary-gifts', description: 'Celebrate love and togetherness' },
      { name: 'Wedding Gifts',     slug: 'wedding-gifts',     description: 'Beautiful gifts for weddings' },
      { name: 'Baby Shower',       slug: 'baby-shower',       description: 'Adorable gifts for new arrivals' },
      { name: 'Corporate Gifts',   slug: 'corporate-gifts',   description: 'Professional gift hampers' },
      { name: 'Festival Gifts',    slug: 'festival-gifts',    description: 'Diwali, Holi, Christmas gifts' },
      { name: 'Chocolate Boxes',   slug: 'chocolate-boxes',   description: 'Premium chocolate collections' },
      { name: 'Flower Bouquets',   slug: 'flower-bouquets',   description: 'Fresh flower arrangements' },
    ];

    for (const cat of categories) {
      await connection.execute(
        `INSERT IGNORE INTO categories (name, slug, description, is_active) VALUES (?, ?, ?, TRUE)`,
        [cat.name, cat.slug, cat.description]
      );
    }
    console.log('✅ Categories seeded');

    // ─── Sample Products ──────────────────────────────────────────────────────
    const [cats] = await connection.execute('SELECT id, slug FROM categories');
    const catMap = {};
    cats.forEach(c => catMap[c.slug] = c.id);

    const products = [
      {
        category_id: catMap['birthday-gifts'],
        name: 'Premium Birthday Hamper',
        slug: 'premium-birthday-hamper',
        description: '<p>A luxurious birthday gift box filled with premium chocolates, scented candles, and a personalised greeting card.</p>',
        short_description: 'Luxury birthday hamper with chocolates and candles',
        price: 1499,
        sale_price: 1199,
        occasion: 'birthday',
        is_featured: true,
        stock: 50,
      },
      {
        category_id: catMap['anniversary-gifts'],
        name: 'Anniversary Love Box',
        slug: 'anniversary-love-box',
        description: '<p>Express your love with this beautiful anniversary gift box — roses, chocolates, and a heartfelt message card.</p>',
        short_description: 'Roses, chocolates and love for your anniversary',
        price: 1999,
        sale_price: 1599,
        occasion: 'anniversary',
        is_featured: true,
        stock: 30,
      },
      {
        category_id: catMap['chocolate-boxes'],
        name: 'Belgian Chocolate Collection',
        slug: 'belgian-chocolate-collection',
        description: '<p>An exquisite collection of handpicked Belgian chocolates in an elegant gift box.</p>',
        short_description: 'Premium Belgian chocolate assortment',
        price: 899,
        sale_price: null,
        occasion: 'birthday',
        is_featured: true,
        stock: 100,
      },
      {
        category_id: catMap['corporate-gifts'],
        name: 'Corporate Festive Hamper',
        slug: 'corporate-festive-hamper',
        description: '<p>Professional gift hamper ideal for corporate gifting — dry fruits, sweets, and premium packaging.</p>',
        short_description: 'Premium dry fruits and sweets in luxury packaging',
        price: 2499,
        sale_price: 1999,
        occasion: 'corporate',
        is_featured: false,
        stock: 75,
      },
      {
        category_id: catMap['festival-gifts'],
        name: 'Diwali Special Box',
        slug: 'diwali-special-box',
        description: '<p>Celebrate the festival of lights with this beautiful Diwali hamper — diyas, sweets, and dry fruits.</p>',
        short_description: 'Diyas, sweets and dry fruits for Diwali',
        price: 1299,
        sale_price: 999,
        occasion: 'festivals',
        is_featured: true,
        stock: 200,
      },
      {
        category_id: catMap['baby-shower'],
        name: 'Baby Welcome Kit',
        slug: 'baby-welcome-kit',
        description: '<p>Welcome the little one with this adorable baby shower gift — soft toys, baby clothes, and more.</p>',
        short_description: 'Adorable gift kit for newborns',
        price: 1799,
        sale_price: 1499,
        occasion: 'baby-shower',
        is_featured: false,
        stock: 40,
      },
    ];

    for (const p of products) {
      const { stock, ...productData } = p;

      const [result] = await connection.execute(
        `INSERT IGNORE INTO products 
         (category_id, name, slug, description, short_description, price, sale_price, occasion, is_featured, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [productData.category_id, productData.name, productData.slug,
         productData.description, productData.short_description,
         productData.price, productData.sale_price || null,
         productData.occasion, productData.is_featured]
      );

      if (result.insertId) {
        await connection.execute(
          'INSERT IGNORE INTO inventory (product_id, quantity, low_stock_alert) VALUES (?, ?, ?)',
          [result.insertId, stock, 10]
        );
      }
    }
    console.log('✅ Sample products seeded');

    // ─── Sample Coupon ────────────────────────────────────────────────────────
    await connection.execute(
      `INSERT IGNORE INTO coupons 
       (code, type, value, min_order_amount, max_discount, usage_limit, is_active, valid_from, valid_until)
       VALUES (?, ?, ?, ?, ?, ?, TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
      ['FIRST15', 'percentage', 15, 299, 200, 1000]
    );
    await connection.execute(
      `INSERT IGNORE INTO coupons 
       (code, type, value, min_order_amount, is_active, valid_from, valid_until)
       VALUES (?, ?, ?, ?, TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
      ['FLAT100', 'fixed', 100, 599]
    );
    console.log('✅ Sample coupons seeded (FIRST15, FLAT100)');

    console.log('\n🎉 Database seeded successfully!');
    console.log('📦 Categories: 8');
    console.log('🎁 Products: 6 sample products');
    console.log('🏷️  Coupons: FIRST15 (15% off), FLAT100 (₹100 off)');
    console.log('\nYou can now add more products from the Admin Panel → Products');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
