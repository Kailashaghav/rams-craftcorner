/**
 * Category Controller
 * Full CRUD for product categories
 */

const db = require('../config/database');
const { deleteImage } = require('../config/cloudinary');

// Get all categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await db.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = TRUE) as product_count
       FROM categories c
       ORDER BY c.sort_order ASC, c.name ASC`
    );
    res.json({ success: true, categories });
  } catch (err) { next(err); }
};

// Get single category by slug
exports.getCategory = async (req, res, next) => {
  try {
    const [category] = await db.query(
      'SELECT * FROM categories WHERE slug = ?', [req.params.slug]
    );
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, category });
  } catch (err) { next(err); }
};

// Create category (Admin)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, parent_id, sort_order, meta_title, meta_description } = req.body;

    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const image_url = req.file?.path || null;
    const public_id = req.file?.filename || null;

    const result = await db.query(
      `INSERT INTO categories (name, slug, description, image_url, parent_id, sort_order, meta_title, meta_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description || null, image_url, parent_id || null,
       sort_order || 0, meta_title || null, meta_description || null]
    );

    const [newCat] = await db.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Category created', category: newCat });
  } catch (err) { next(err); }
};

// Update category (Admin)
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id, sort_order, is_active } = req.body;

    const [existing] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Category not found' });

    const image_url = req.file?.path || existing.image_url;

    await db.query(
      `UPDATE categories SET name=?, description=?, image_url=?, parent_id=?, 
       sort_order=?, is_active=? WHERE id=?`,
      [name, description || null, image_url, parent_id || null,
       sort_order || 0, is_active !== undefined ? is_active : true, id]
    );

    res.json({ success: true, message: 'Category updated' });
  } catch (err) { next(err); }
};

// Delete category (Admin)
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [productCount] = await db.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]
    );
    if (productCount.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete — ${productCount.count} products use this category.`
      });
    }
    await db.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
};
