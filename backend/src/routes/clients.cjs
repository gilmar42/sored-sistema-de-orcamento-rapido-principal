const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Get all clients
router.get('/', async (req, res) => {
  try {
    const [clients] = await db.query(
      'SELECT * FROM clients WHERE tenant_id = ? ORDER BY name',
      [req.user.tenantId]
    );

    res.json(clients);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create client
router.post('/', async (req, res) => {
  try {
    const client = req.body;
    const id = client.id || `C-${Date.now()}`;

    await db.query(`
      INSERT INTO clients (id, name, email, phone, address, tenant_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      id,
      client.name,
      client.email || '',
      client.phone || '',
      client.address || '',
      req.user.tenantId
    ]);

    res.status(201).json({ id, ...client });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = req.body;

    await db.query(`
      UPDATE clients 
      SET name = ?, email = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, [
      client.name,
      client.email || '',
      client.phone || '',
      client.address || '',
      id,
      req.user.tenantId
    ]);

    res.json({ id, ...client });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete client
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM clients WHERE id = ? AND tenant_id = ?', [id, req.user.tenantId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
