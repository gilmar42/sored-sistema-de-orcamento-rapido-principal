const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Get all clients
router.get('/', (req, res) => {
  try {
    const clients = db
      .prepare('SELECT * FROM clients WHERE tenant_id = ? ORDER BY name')
      .all(req.user.tenantId);

    res.json(clients);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create client
router.post('/', (req, res) => {
  try {
    const client = req.body;
    const id = client.id || `C-${Date.now()}`;

    db.prepare(`
      INSERT INTO clients (id, name, email, phone, address, tenant_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      client.name,
      client.email || '',
      client.phone || '',
      client.address || '',
      req.user.tenantId
    );

    res.status(201).json({ id, ...client });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update client
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const client = req.body;

    db.prepare(`
      UPDATE clients 
      SET name = ?, email = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `).run(
      client.name,
      client.email || '',
      client.phone || '',
      client.address || '',
      id,
      req.user.tenantId
    );

    res.json({ id, ...client });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete client
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM clients WHERE id = ? AND tenant_id = ?').run(id, req.user.tenantId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
