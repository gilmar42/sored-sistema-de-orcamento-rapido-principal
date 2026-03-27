// import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProd = mode === 'production';

    return {
      root: 'frontend',
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
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(mode),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'frontend'),
        }
      }
    };
});
