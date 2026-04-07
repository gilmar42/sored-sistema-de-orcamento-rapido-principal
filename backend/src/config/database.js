const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

// Garante que o .env seja lido mesmo se o server.js falhar
dotenv.config(); // Raiz do CWD
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') }); // ../../.env (raiz do backend)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') }); // ../.env (dentro de src ou backend)


// Create connection pool (Lazy initialization)
let _pool = null;

function getPool() {
  if (!_pool) {
    const dbHost = process.env.DB_HOST || process.env.DATABASE_HOST || '127.0.0.1';
    const dbUser = process.env.DB_USER || process.env.DATABASE_USER || 'root';
    const dbPass = process.env.DB_PASSWORD || process.env.DB_PASS || process.env.DATABASE_PASSWORD || '';
    const dbName = process.env.DB_NAME || process.env.DATABASE_NAME || 'sored';

    console.log(`🔌 Inicializando Pool MySQL: ${dbHost} (User: ${dbUser}, Banco: ${dbName})`);
    
    _pool = mysql.createPool({
      host: dbHost,
      user: dbUser,
      password: dbPass,
      database: dbName,
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return _pool;
}

// Proxy methods for the pool
const poolProxy = {
  query: (...args) => getPool().query(...args),
  getConnection: (...args) => getPool().getConnection(...args)
};

let initRetries = 0;
const MAX_RETRIES = 3;

async function ensureColumn(connection, table, columnDefinition) {
  try {
    await connection.query(`ALTER TABLE ${table} ADD COLUMN ${columnDefinition}`);
  } catch (error) {
    if (!['ER_DUP_FIELDNAME', 'ER_CANT_ADD_FIELD', 'ER_DUP_KEYNAME'].includes(error.code)) {
      throw error;
    }
  }
}

async function initDB() {
  let connection;
  const isProduction = process.env.NODE_ENV === 'production';
  try {
    console.log(`🧪 Verificando Conexão MySQL: ${process.env.DB_HOST} (User: ${process.env.DB_USER})`);
    connection = await poolProxy.getConnection();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id VARCHAR(255) PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

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

    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        tenant_id VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS materials (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id VARCHAR(255),
        unit_weight DOUBLE NOT NULL,
        unit VARCHAR(50) NOT NULL,
        unit_cost DOUBLE NOT NULL,
        tenant_id VARCHAR(255) NOT NULL,
        components JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(255),
        address TEXT,
        tenant_id VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id VARCHAR(255) PRIMARY KEY,
        date TEXT NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        items JSON NOT NULL,
        labor_cost DOUBLE DEFAULT 0,
        freight_cost DOUBLE DEFAULT 0,
        profit_margin DOUBLE DEFAULT 20,
        is_freight_enabled BOOLEAN DEFAULT 0,
        tenant_id VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(255) PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        company_contact VARCHAR(255),
        company_logo TEXT,
        default_tax DOUBLE DEFAULT 0,
        tenant_id VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

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

    await connection.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Mongoose to MySQL Migrated Tables
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

    await ensureColumn(connection, 'users', 'trial_started_at DATETIME NULL');
    await ensureColumn(connection, 'users', 'trial_ends_at DATETIME NULL');
    await ensureColumn(connection, "users", "access_status VARCHAR(50) DEFAULT 'trial'");

    console.log('✅ MySQL Database initialized successfully');
  } catch (error) {
    if (error.code === 'ER_BAD_DB_ERROR' && !isProduction && initRetries < MAX_RETRIES) {
      initRetries++;
      console.warn(`⚠️ DB não encontrado localmente. Tentando criação (${initRetries}/${MAX_RETRIES})...`);
      try {
        const tempPool = mysql.createPool({
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          port: process.env.DB_PORT || 3306,
        });
        const dbName = process.env.DB_NAME || 'sored';
        await tempPool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await tempPool.end();
        console.log('✅ Database criado com sucesso. Retentando...');
        return initDB();
      } catch (creationError) {
        console.error('❌ Falha ao criar banco de dados local:', creationError.message);
      }
    } else {
      console.error('❌ ERRO CRÍTICO NA INICIALIZAÇÃO DO BANCO:');
      console.error(`- Código: ${error.code}`);
      console.error(`- Mensagem: ${error.message}`);
      console.error(`- Host: ${process.env.DB_HOST}`);
      console.error(`- Usuário: ${process.env.DB_USER}`);
      console.error(`- Banco: ${process.env.DB_NAME}`);
      console.error('DICA: Na Hostinger, certifique-se de que o banco e o usuário foram criados no hPanel.');
    }
  } finally {
    if (connection) connection.release();
  }
}

// Inicializa a conexão (Opcional, pode ser chamado externamente)
// initDB(); 

module.exports = poolProxy;
