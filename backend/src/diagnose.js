const mysql = require('mysql2/promise');
const { MercadoPagoConfig, PreApprovalPlan } = require('mercadopago');
const path = require('path');
const fs = require('fs');

// Load environment from backend/.env
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

async function runDiagnosis() {
  console.log('--- 🧪 DIAGNÓSITCO SORED ---');
  console.log('Versão: 1.0.0');

  // 1. MySQL Test
  console.log('\n[1] TESTANDO MYSQL...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sored',
      port: process.env.DB_PORT || 3306,
    });
    console.log('✅ Conexão MySQL: SUCESSO!');
    const [rows] = await connection.query('SHOW TABLES');
    console.log(`✅ Tabelas encontradas: ${rows.length}`);
    await connection.end();
  } catch (err) {
    console.error('❌ Falha na Conexão MySQL:');
    console.error(`- Host: ${process.env.DB_HOST}`);
    console.error(`- Usuário: ${process.env.DB_USER}`);
    console.error(`- Erro: ${err.message}`);
  }

  // 2. Mercado Pago Test
  console.log('\n[2] TESTANDO MERCADO PAGO...');
  try {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) throw new Error('MP_ACCESS_TOKEN não definido no .env');
    
    console.log(`- Usando Token: ${token.substring(0, 15)}...`);
    const mpClient = new MercadoPagoConfig({ accessToken: token });
    const preApprovalPlan = new PreApprovalPlan(mpClient);
    
    // Tenta uma busca simples de planos existentes para validar o token
    const result = await preApprovalPlan.search({
      options: { limit: 1 }
    });
    console.log('✅ API Mercado Pago: SUCESSO (Token Válido)!');
  } catch (err) {
    console.error('❌ Falha na Conexão Mercado Pago:');
    console.error(`- Erro: ${err.message}`);
    if (err.response) {
      console.error('- Detalhes MP:', JSON.stringify(err.response, null, 2));
    }
  }

  console.log('\n--- FIM DO DIAGNÓSTICO ---');
}

runDiagnosis();
