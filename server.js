const path = require('path');
const dotenv = require('dotenv');

// Carrega .env da Raiz ou da pasta Backend (para garantir que a senha seja lida)
dotenv.config(); // Primeiro tenta a raiz
dotenv.config({ path: path.resolve(__dirname, 'backend', '.env') }); // Depois tenta a pasta backend
const express = require('express');
const fs = require('fs');

// Importa e inicializa imediatamente a API (Backend)
const app = require('./backend/src/app.cjs');

// Configura o servidor Express (que já está rodando a API) para TAMBÉM servir o Frontend

// O Output Directory definido para a Hostinger é a pasta 'dist' gerada pelo Vite dentro do frontend
const distPath = path.join(__dirname, 'frontend', 'dist');

// Serve os arquivos estáticos
app.use(express.static(distPath));

// Rota de Check-in de Emergência (Para provar o Deploy)
app.get('/api/check-in', (req, res) => {
    res.json({
        status: 'DEPLOY_SUCCESS_V2',
        timestamp: new Date().toISOString(),
        cwd: process.cwd(),
        backend_env: process.env.NODE_ENV
    });
});

// Consigo checar o sistema inteiro aqui também
app.get('/api/system-check', async (req, res) => {
    try {
        const db = require('./backend/src/config/database');
        const [rows] = await db.query('SELECT 1 as alive');
        
        res.json({
            status: 'UP',
            database: '✅ CONECTADO',
            cwd: process.cwd(),
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({
            status: 'DOWN',
            database: '❌ ERRO: ' + err.message,
            cwd: process.cwd(),
            hint: 'O servidor não conseguiu conectar ao banco. Verifique o seu .env'
        });
    }
});

// Manda tudo que não for requisição da API para o Roteador do React (index.html)
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        return next();
    }
    
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Aguardando a Build do Frontend na pasta dist...');
    }
});

// Inicia o servidor unificado
const PORT = process.env.PORT || 9000;
app.listen(PORT, async () => {
    console.log(`🚀 Unified Server running on http://localhost:${PORT}`);
    console.log(`✅ Server.js carregado: Unificando Backend e Frontend na mesma porta para deploy!`);

    // Tenta inicializar o banco de dados (sem travar o servidor)
    try {
        const { initDB } = require('./backend/src/config/database_utils.cjs'); // Vou criar este helper separado
        // find database.js and call initDB if exported
    } catch (e) {
        console.error('⚠️ Aviso: Inicialização automática do banco falhou. Use /api/system-check para diagnosticar.');
    }
});
