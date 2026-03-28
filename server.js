require('dotenv').config({ path: require('path').resolve(__dirname, 'backend', '.env') });
const express = require('express');
const path = require('path');
const fs = require('fs');

// Importa e inicializa imediatamente a API (Backend)
const app = require('./backend/src/app.cjs');

// Configura o servidor Express (que já está rodando a API) para TAMBÉM servir o Frontend

// O Output Directory definido para a Hostinger é a pasta 'dist' gerada pelo Vite dentro do frontend
const distPath = path.join(__dirname, 'frontend', 'dist');

// Serve os arquivos estáticos
app.use(express.static(distPath));

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
