import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiApp } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = createApiApp();
const PORT = Number(process.env.PORT) || 3456;

if (process.env.NODE_ENV === 'production') {
  const distDir = path.resolve(__dirname, '../dist');
  app.use(express.static(distDir));
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`g0v-slack-viewer server listening on http://localhost:${PORT}`);
});
