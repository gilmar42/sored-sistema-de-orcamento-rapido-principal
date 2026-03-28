const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Get all materials
router.get('/', async (req, res) => {
  try {
    const [materials] = await db.query(
      'SELECT * FROM materials WHERE tenant_id = ? ORDER BY created_at DESC',
      [req.user.tenantId]
    );

    // Parse components JSON
    const parsedMaterials = materials.map((m) => {
      let components = [];
      if (m.components) {
        try {
          components = typeof m.components === 'string' ? JSON.parse(m.components) : m.components;
        } catch (e) {
          components = [];
        }
      }
      return {
        ...m,
        unitWeight: m.unit_weight,
        unitCost: m.unit_cost,
        categoryId: m.category_id,
        components,
      };
    });

    res.json(parsedMaterials);
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create material
router.post('/', async (req, res) => {
  try {
    const material = req.body;
    const id = material.id || `MAT-${Date.now()}`;

    await db.query(`
      INSERT INTO materials (id, name, description, category_id, unit_weight, unit, unit_cost, components, tenant_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      material.name,
      material.description || '',
      material.categoryId || null,
      material.unitWeight,
      material.unit,
      material.unitCost,
      JSON.stringify(material.components || []),
      req.user.tenantId
    ]);

    res.status(201).json({ id, ...material });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update material
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const material = req.body;

    await db.query(`
      UPDATE materials 
      SET name = ?, description = ?, category_id = ?, unit_weight = ?, unit = ?, 
          unit_cost = ?, components = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, [
      material.name,
      material.description || '',
      material.categoryId || null,
      material.unitWeight,
      material.unit,
      material.unitCost,
      JSON.stringify(material.components || []),
      id,
      req.user.tenantId
    ]);

    res.json({ id, ...material });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete material
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM materials WHERE id = ? AND tenant_id = ?', [id, req.user.tenantId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
