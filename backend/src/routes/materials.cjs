const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Get all materials
router.get('/', (req, res) => {
  try {
    const materials = db
      .prepare('SELECT * FROM materials WHERE tenant_id = ? ORDER BY created_at DESC')
      .all(req.user.tenantId);

    // Parse components JSON
    const parsedMaterials = materials.map((m) => ({
      ...m,
      unitWeight: m.unit_weight,
      unitCost: m.unit_cost,
      categoryId: m.category_id,
      components: m.components ? JSON.parse(m.components) : [],
    }));

    res.json(parsedMaterials);
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create material
router.post('/', (req, res) => {
  try {
    const material = req.body;
    const id = material.id || `MAT-${Date.now()}`;

    db.prepare(`
      INSERT INTO materials (id, name, description, category_id, unit_weight, unit, unit_cost, components, tenant_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      material.name,
      material.description || '',
      material.categoryId || null,
      material.unitWeight,
      material.unit,
      material.unitCost,
      JSON.stringify(material.components || []),
      req.user.tenantId
    );

    res.status(201).json({ id, ...material });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update material
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const material = req.body;

    db.prepare(`
      UPDATE materials 
      SET name = ?, description = ?, category_id = ?, unit_weight = ?, unit = ?, 
          unit_cost = ?, components = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `).run(
      material.name,
      material.description || '',
      material.categoryId || null,
      material.unitWeight,
      material.unit,
      material.unitCost,
      JSON.stringify(material.components || []),
      id,
      req.user.tenantId
    );

    res.json({ id, ...material });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete material
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    db.prepare('DELETE FROM materials WHERE id = ? AND tenant_id = ?').run(id, req.user.tenantId);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
