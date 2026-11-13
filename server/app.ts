import express from 'express';
import {
  getChannelMessages,
  getChannels,
  getStats,
  proxySlackFile,
  searchMessages,
} from './scraper.js';

export function createApiApp(): express.Express {
  const app = express();

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/stats', async (_req, res) => {
    try {
      const stats = await getStats();
      res.setHeader(
        'Cache-Control',
        'public, s-maxage=600, stale-while-revalidate=1800'
      );
      res.json(stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
      res.status(502).json({ error: 'Failed to fetch archive stats' });
    }
  });

  app.get('/api/channels', async (_req, res) => {
    try {
      const channels = await getChannels();
      res.setHeader(
        'Cache-Control',
        'public, s-maxage=600, stale-while-revalidate=1800'
      );
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
      res.setHeader(
        'Cache-Control',
        'public, s-maxage=180, stale-while-revalidate=600'
      );
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
      const currentMonth = new Date().toISOString().slice(0, 7);
      if (month < currentMonth) {
        res.setHeader(
          'Cache-Control',
          'public, s-maxage=3600, stale-while-revalidate=86400'
        );
      } else {
        res.setHeader(
          'Cache-Control',
          'public, s-maxage=180, stale-while-revalidate=600'
        );
      }
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
      res.setHeader(
        'Cache-Control',
        'public, s-maxage=120, stale-while-revalidate=300'
      );
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
      res.setHeader(
        'Cache-Control',
        'public, max-age=86400, s-maxage=604800'
      );
      res.send(buffer);
    } catch (err) {
      console.error('Error proxying file:', err);
      res.status(502).json({ error: 'Failed to proxy file' });
    }
  });

  return app;
}
