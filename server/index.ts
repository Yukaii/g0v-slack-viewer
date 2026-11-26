import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiApp } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = createApiApp();
const PORT = Number(process.env.PORT) || 3456;

const NO_CACHE_BASENAMES = new Set([
  'index.html',
  'sw.js',
  'registerSW.js',
  'manifest.webmanifest',
]);

if (process.env.NODE_ENV === 'production') {
  const distDir = path.resolve(__dirname, '../dist');
  const assetsDir = path.join(distDir, 'assets') + path.sep;
  app.use(
    express.static(distDir, {
      setHeaders(res, filePath) {
        const base = path.basename(filePath);
        if (NO_CACHE_BASENAMES.has(base)) {
          res.setHeader('Cache-Control', 'no-cache, must-revalidate');
          if (base === 'manifest.webmanifest') {
            res.setHeader(
              'Content-Type',
              'application/manifest+json; charset=utf-8'
            );
          }
        } else if (filePath.startsWith(assetsDir)) {
          res.setHeader(
            'Cache-Control',
            'public, max-age=31536000, immutable'
          );
        }
      },
    })
  );
  app.get('/{*splat}', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`g0v-slack-viewer server listening on http://localhost:${PORT}`);
});
