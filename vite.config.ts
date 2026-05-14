// import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const frontendDir = path.resolve(__dirname, 'frontend');
    const env = loadEnv(mode, frontendDir, '');
    
    // Diagnóstico durante o build
    console.log('\n--- 🛠️ VITE BUILD DIAGNOSTICS ---');
    console.log(`📍 Mode: ${mode}`);
    console.log(`📍 Frontend Dir: ${frontendDir}`);
    console.log(`✅ MP Key Found: ${env.VITE_MP_PUBLIC_KEY ? 'YES (' + env.VITE_MP_PUBLIC_KEY.slice(0, 10) + '...)' : '❌ NO'}`);
    console.log('--------------------------------\n');

    const isProd = mode === 'production';
    const definedEnv = Object.fromEntries(
      Object.entries(env)
        .filter(([key]) => key.startsWith('VITE_'))
        .flatMap(([key, value]) => [
          [`process.env.${key}`, JSON.stringify(value)],
          [`import.meta.env.${key}`, JSON.stringify(value)]
        ])
    );

    return {
      root: 'frontend',
      envDir: frontendDir,
      define: definedEnv,
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:9000',
            changeOrigin: true,
            rewrite: (path) => path,
          },
        },
      },
      plugins: [
        react(),
        tailwindcss(),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './frontend'),
        },
      },
      build: {
        outDir: 'dist',
        target: 'es2020',
        minify: 'terser',
        cssMinify: true,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              utils: ['uuid'],
            },
            compact: true,
          },
        },
        sourcemap: !isProd,
        chunkSizeWarningLimit: 500,
        reportCompressedSize: false,
      }
    };
});
