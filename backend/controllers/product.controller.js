/**
 * Product Controller
 * Full CRUD with search, filtering, sorting, and pagination
 */

const db = require('../config/database');
const { deleteImage } = require('../config/cloudinary');

// ─── Get All Products ─────────────────────────────────────────────────────────
exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      category,
      occasion,
      minPrice,
      maxPrice,
      sort = 'created_at',
      order = 'DESC',
      featured,
    } = req.query;

    // Fixed: parse to safe integers, never pass these as bound params (mysql2 LIMIT/OFFSET bug)
    const limitNum  = Math.max(1, Math.min(100, parseInt(limit) || 12));
    const pageNum   = Math.max(1, parseInt(page) || 1);
    const offsetNum = (pageNum - 1) * limitNum;

    const params = [];
    const conditions = ['p.is_active = 1'];

    if (search) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category && category !== '') { conditions.push('c.slug = ?'); params.push(category); }
    if (occasion && occasion !== '') { conditions.push('p.occasion = ?'); params.push(occasion); }
    if (minPrice && minPrice !== '') { conditions.push('COALESCE(p.sale_price, p.price) >= ?'); params.push(parseFloat(minPrice)); }
    if (maxPrice && maxPrice !== '') { conditions.push('COALESCE(p.sale_price, p.price) <= ?'); params.push(parseFloat(maxPrice)); }
    if (featured === 'true') { conditions.push('p.is_featured = 1'); }

    const allowedSort = {
      price:      'COALESCE(p.sale_price, p.price)',
      name:       'p.name',
      created_at: 'p.created_at',
      rating:     'p.avg_rating',
    };
    const sortCol   = allowedSort[sort] || 'p.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}`,
      params
    );

    // Fixed: LIMIT/OFFSET inlined directly as numbers — never as "?" params
    const products = await db.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug,
        (SELECT image_url FROM product_images
         WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as primary_image,
        COALESCE(i.quantity, 0) as stock
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN inventory i ON p.id = i.product_id
       ${whereClause}
       ORDER BY ${sortCol} ${sortOrder}
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
    );

    res.status(200).json({
      success: true,
      products,
      pagination: {
        total:      countResult.total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(countResult.total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Product ───────────────────────────────────────────────────────
exports.getProduct = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const [product] = await db.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug,
        COALESCE(i.quantity, 0) as stock, i.low_stock_alert
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.slug = ? AND p.is_active = 1`,
      [slug]
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const images = await db.query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC',
      [product.id]
    );

    const reviews = await db.query(
      `SELECT r.*, u.name as user_name, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? AND r.is_approved = 1
       ORDER BY r.created_at DESC LIMIT 10`,
      [product.id]
    );

    const related = await db.query(
      `SELECT p.id, p.name, p.slug, p.price, p.sale_price, p.avg_rating,
        (SELECT image_url FROM product_images
         WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as primary_image
       FROM products p
       WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
       LIMIT 4`,
      [product.category_id, product.id]
    );

    res.status(200).json({
      success: true,
      product: { ...product, images, reviews, related },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Create Product (Admin) ───────────────────────────────────────────────────
exports.createProduct = async (req, res, next) => {
  try {
    const {
      category_id, name, description, short_description,
      price, sale_price, sku, occasion,
      is_featured, is_customizable, meta_title,
      meta_description, stock_quantity, low_stock_alert,
    } = req.body;

    if (!name || !category_id || !price) {
      return res.status(400).json({ success: false, message: 'Name, category and price are required.' });
    }

    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();

    const isFeatured     = (is_featured     === 'true' || is_featured     === true) ? 1 : 0;
    const isCustomizable = (is_customizable === 'true' || is_customizable === true) ? 1 : 0;

    const result = await db.query(
      `INSERT INTO products
        (category_id, name, slug, description, short_description,
         price, sale_price, sku, occasion,
         is_featured, is_customizable, is_active,
         meta_title, meta_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        parseInt(category_id), name, slug,
        description || null, short_description || null,
        parseFloat(price), sale_price ? parseFloat(sale_price) : null,
        sku || null, occasion || null,
        isFeatured, isCustomizable,
        meta_title || null, meta_description || null,
      ]
    );

    const productId = result.insertId;

    await db.query(
      'INSERT INTO inventory (product_id, quantity, low_stock_alert) VALUES (?, ?, ?)',
      [productId, parseInt(stock_quantity) || 0, parseInt(low_stock_alert) || 10]
    );

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        await db.query(
          `INSERT INTO product_images
            (product_id, image_url, public_id, is_primary, sort_order)
           VALUES (?, ?, ?, ?, ?)`,
          [productId, req.files[i].path, req.files[i].filename, i === 0 ? 1 : 0, i]
        );
      }
    }

    const [newProduct] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product: newProduct,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Update Product (Admin) ───────────────────────────────────────────────────
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      category_id, name, description, short_description,
      price, sale_price, sku, occasion,
      is_featured, is_customizable, is_active,
      meta_title, meta_description,
      stock_quantity, low_stock_alert,
    } = req.body;

    const [product] = await db.query('SELECT id FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const isFeatured     = (is_featured     === 'true' || is_featured     === true) ? 1 : 0;
    const isCustomizable = (is_customizable === 'true' || is_customizable === true) ? 1 : 0;
    const isActive       = (is_active === 'true' || is_active === true || is_active === undefined) ? 1 : 0;

    await db.query(
      `UPDATE products SET
        category_id=?, name=?, description=?, short_description=?,
        price=?, sale_price=?, sku=?, occasion=?,
        is_featured=?, is_customizable=?, is_active=?,
        meta_title=?, meta_description=?
       WHERE id=?`,
      [
        parseInt(category_id), name,
        description || null, short_description || null,
        parseFloat(price), sale_price ? parseFloat(sale_price) : null,
        sku || null, occasion || null,
        isFeatured, isCustomizable, isActive,
        meta_title || null, meta_description || null,
        id,
      ]
    );

    if (stock_quantity !== undefined) {
      await db.query(
        'UPDATE inventory SET quantity=?, low_stock_alert=? WHERE product_id=?',
        [parseInt(stock_quantity) || 0, parseInt(low_stock_alert) || 10, id]
      );
    }

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        await db.query(
          `INSERT INTO product_images
            (product_id, image_url, public_id, is_primary, sort_order)
           VALUES (?, ?, ?, ?, ?)`,
          [id, req.files[i].path, req.files[i].filename, 0, i]
        );
      }
    }

    const [updated] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product: updated,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Product (Admin) ───────────────────────────────────────────────────
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const images = await db.query(
      'SELECT public_id FROM product_images WHERE product_id = ?', [id]
    );
    for (const img of images) {
      if (img.public_id) await deleteImage(img.public_id);
    }

    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── Get Featured Products ────────────────────────────────────────────────────
exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await db.query(
      `SELECT p.id, p.name, p.slug, p.price, p.sale_price,
        p.avg_rating, p.review_count, p.occasion,
        (SELECT image_url FROM product_images
         WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as primary_image,
        COALESCE(i.quantity, 0) as stock
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.is_featured = 1 AND p.is_active = 1
       ORDER BY p.created_at DESC
       LIMIT 8`
    );
    res.status(200).json({ success: true, products });
  } catch (err) {
    next(err);
  }
};