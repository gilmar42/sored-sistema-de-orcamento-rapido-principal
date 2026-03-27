const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Get all quotes
router.get('/', (req, res) => {
  try {
    const quotes = db
      .prepare('SELECT * FROM quotes WHERE tenant_id = ? ORDER BY date DESC')
      .all(req.user.tenantId);

    const parsedQuotes = quotes.map((q) => ({
      ...q,
      clientName: q.client_name,
      laborCost: q.labor_cost,
      freightCost: q.freight_cost,
      profitMargin: q.profit_margin,
      isFreightEnabled: Boolean(q.is_freight_enabled),
      items: JSON.parse(q.items),
    }));

    res.json(parsedQuotes);
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create quote
router.post('/', (req, res) => {
  try {
    const quote = req.body;
    const id = quote.id || `Q-${Date.now()}`;

    db.prepare(`
      INSERT INTO quotes (id, date, client_name, items, labor_cost, freight_cost, profit_margin, is_freight_enabled, tenant_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      quote.date,
      quote.clientName,
      JSON.stringify(quote.items),
      quote.laborCost || 0,
      quote.freightCost || 0,
      quote.profitMargin || 20,
      quote.isFreightEnabled ? 1 : 0,
      req.user.tenantId
    );

    res.status(201).json({ id, ...quote });
  } catch (error) {
    console.error('Create quote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update quote
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const quote = req.body;

    db.prepare(`
      UPDATE quotes 
      SET date = ?, client_name = ?, items = ?, labor_cost = ?, freight_cost = ?, 
          profit_margin = ?, is_freight_enabled = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `).run(
      quote.date,
      quote.clientName,
      JSON.stringify(quote.items),
      quote.laborCost || 0,
      quote.freightCost || 0,
      quote.profitMargin || 20,
      quote.isFreightEnabled ? 1 : 0,
      id,
      req.user.tenantId
    );

    res.json({ id, ...quote });
  } catch (error) {
    console.error('Update quote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete quote
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM quotes WHERE id = ? AND tenant_id = ?').run(id, req.user.tenantId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete quote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
