const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const pool = require('./database');

async function ensureColumn(connection, table, columnDefinition) {
  try {
    await connection.query(`ALTER TABLE ${table} ADD COLUMN ${columnDefinition}`);
  } catch (error) {
    if (!['ER_DUP_FIELDNAME', 'ER_CANT_ADD_FIELD', 'ER_DUP_KEYNAME'].includes(error.code)) {
      throw error;
    }
  }
}

async function purgeDemoAccounts(connection) {
  const demoEmails = ['debugteste@example.com'];
  const demoCompanyNames = ['Empresa Demo', 'Debug Teste'];

  const [demoUsers] = await connection.query(
    `
      SELECT u.id, u.email
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      WHERE u.email LIKE ? OR u.email IN (?) OR t.company_name IN (?)
    `,
    ['%@sored.demo', demoEmails, demoCompanyNames]
  );

  if (!Array.isArray(demoUsers) || demoUsers.length === 0) {
    return 0;
  }

  const demoTenantIds = await connection.query(
    `
      SELECT DISTINCT u.tenant_id
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      WHERE u.email LIKE ? OR u.email IN (?) OR t.company_name IN (?)
    `,
    ['%@sored.demo', demoEmails, demoCompanyNames]
  ).then(([rows]) => rows.map((row) => row.tenant_id).filter(Boolean));

  if (demoTenantIds.length > 0) {
    await connection.query('DELETE FROM payments WHERE payer_email LIKE ? OR payer_email IN (?)', ['%@sored.demo', demoEmails]);
    await connection.query('DELETE FROM tenants WHERE id IN (?)', [demoTenantIds]);
  }

  return demoUsers.length;
}

async function initDB() {
  let connection;
  const isProduction = process.env.NODE_ENV === 'production';
  try {
    console.log(`🔌 [INIT DB] Verificando tabelas no MariaDB/MySQL...`);
    connection = await pool.getConnection();

    // Tenants Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id VARCHAR(255) PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        tenant_id VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        trial_started_at DATETIME,
        trial_ends_at DATETIME,
        access_status VARCHAR(50) DEFAULT 'trial',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Plans Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        planType VARCHAR(50) NOT NULL UNIQUE,
        mpPlanId VARCHAR(255) NOT NULL UNIQUE,
        price DOUBLE NOT NULL,
        frequency INT NOT NULL,
        frequencyType VARCHAR(50) NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Subscriptions Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId VARCHAR(255) NOT NULL,
        mpSubscriptionId VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(50) NOT NULL,
        planType VARCHAR(50) NOT NULL,
        nextBilling DATETIME,
        gracePeriodUntil DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Payments Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(255) PRIMARY KEY,
        plan_type VARCHAR(255) NOT NULL,
        status VARCHAR(255) NOT NULL,
        amount DOUBLE NOT NULL,
        currency VARCHAR(10) NOT NULL,
        mp_preference_id VARCHAR(255) UNIQUE,
        mp_payment_id VARCHAR(255) UNIQUE,
        payer_email VARCHAR(255),
        idempotency_key VARCHAR(255) UNIQUE,
        raw_payload JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await ensureColumn(connection, 'users', 'trial_started_at DATETIME NULL');
    await ensureColumn(connection, 'users', 'trial_ends_at DATETIME NULL');
    await ensureColumn(connection, "users", "access_status VARCHAR(50) DEFAULT 'trial'");

    if (isProduction) {
      const purged = await purgeDemoAccounts(connection);
      if (purged > 0) {
        console.log(`🧹 [INIT DB] Contas demo removidas da produção: ${purged}`);
      }
    }

    console.log('✅ [INIT DB] Tabelas verificadas/criadas com sucesso!');
  } catch (error) {
     console.error('❌ [INIT DB Error]:', error.message);
     throw error;
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { initDB, purgeDemoAccounts };
