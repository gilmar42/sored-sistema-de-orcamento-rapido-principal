const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Get all categories
router.get('/', (req, res) => {
  try {
    const categories = db
      .prepare('SELECT * FROM categories WHERE tenant_id = ? ORDER BY name')
      .all(req.user.tenantId);

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create category
router.post('/', (req, res) => {
  try {
    const { name } = req.body;
    const id = `CAT-${Date.now()}`;

    db.prepare('INSERT INTO categories (id, name, tenant_id) VALUES (?, ?, ?)').run(
      id,
      name,
      req.user.tenantId
    );

    res.status(201).json({ id, name });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update category
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    db.prepare('UPDATE categories SET name = ? WHERE id = ? AND tenant_id = ?').run(
      name,
      id,
      req.user.tenantId
    );

    res.json({ id, name });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete category
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM categories WHERE id = ? AND tenant_id = ?').run(id, req.user.tenantId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
