const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Get settings
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM settings WHERE tenant_id = ? LIMIT 1',
      [req.user.tenantId]
    );
    const settings = rows[0];

    if (!settings) {
      return res.json({
        companyName: 'Sua Empresa',
        companyContact: '',
        companyLogo: '',
        defaultTax: 0,
      });
    }

    res.json({
      companyName: settings.company_name,
      companyContact: settings.company_contact,
      companyLogo: settings.company_logo,
      defaultTax: settings.default_tax,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update settings
router.put('/', async (req, res) => {
  try {
    const { companyName, companyContact, companyLogo, defaultTax } = req.body;

    // Check if settings exist
    const [rows] = await db.query(
      'SELECT id FROM settings WHERE tenant_id = ? LIMIT 1',
      [req.user.tenantId]
    );
    const existing = rows[0];

    if (existing) {
      await db.query(`
        UPDATE settings 
        SET company_name = ?, company_contact = ?, company_logo = ?, default_tax = ?, updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = ?
      `, [companyName, companyContact || '', companyLogo || '', defaultTax || 0, req.user.tenantId]);
    } else {
      await db.query(`
        INSERT INTO settings (id, company_name, company_contact, company_logo, default_tax, tenant_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        `S-${Date.now()}`,
        companyName,
        companyContact || '',
        companyLogo || '',
        defaultTax || 0,
        req.user.tenantId
      ]);
    }

    res.json({ companyName, companyContact, companyLogo, defaultTax });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
