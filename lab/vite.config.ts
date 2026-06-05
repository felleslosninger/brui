import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      '@ksvedal/docs/search-index': path.resolve(__dirname, './node_modules/@ksvedal/docs/dist/search-index.json'),
    },
  },
  server: {
    port: 5199,
  },
});
