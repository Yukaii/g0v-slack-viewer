import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getChannelMessages,
  getChannels,
  getStats,
  proxySlackFile,
  searchMessages,
} from './scraper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3456;

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/stats', async (_req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(502).json({ error: 'Failed to fetch archive stats' });
  }
});

app.get('/api/channels', async (_req, res) => {
  try {
    const channels = await getChannels();
    res.json({ channels });
  } catch (err) {
    console.error('Error fetching channels:', err);
    res.status(502).json({ error: 'Failed to fetch channels' });
  }
});

app.get('/api/channel/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const data = await getChannelMessages(channelId);
    res.json(data);
  } catch (err) {
    console.error('Error fetching channel:', err);
    res.status(502).json({ error: 'Failed to fetch channel messages' });
  }
});

app.get('/api/channel/:channelId/:month', async (req, res) => {
  try {
    const { channelId, month } = req.params;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({ error: 'Invalid month format (expected YYYY-MM)' });
      return;
    }
    const data = await getChannelMessages(channelId, month);
    res.json(data);
  } catch (err) {
    console.error('Error fetching channel month:', err);
    res.status(502).json({ error: 'Failed to fetch channel messages' });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const data = await searchMessages(q);
    res.json(data);
  } catch (err) {
    console.error('Error searching messages:', err);
    res.status(502).json({ error: 'Failed to search archive' });
  }
});

app.get('/api/file', async (req, res) => {
  try {
    const url = typeof req.query.url === 'string' ? req.query.url : '';
    if (!url.startsWith('https://files.slack.com/')) {
      res.status(400).json({ error: 'Invalid file URL' });
      return;
    }
    const { buffer, contentType } = await proxySlackFile(url);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (err) {
    console.error('Error proxying file:', err);
    res.status(502).json({ error: 'Failed to proxy file' });
  }
});

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
