import { Router } from 'express';
import type { AppDatabase } from '../services/Database';
import type { CloudflareManager } from '../services/CloudflareManager';

export function createSettingsRouter(db: AppDatabase, cloudflareManager: CloudflareManager): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    try { res.json({ success: true, data: db.getSettings() }); }
    catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  router.patch('/', (req, res) => {
    try { const settings = db.updateSettings(req.body); res.json({ success: true, data: settings }); }
    catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.post('/tunnel/start', async (_req, res) => {
    try {
      const settings = db.getSettings();
      const url = await cloudflareManager.start(3000);
      db.updateSettings({ cloudflare_tunnel_url: url, cloudflare_enabled: true });
      res.json({ success: true, data: { url } });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.post('/tunnel/stop', async (_req, res) => {
    try {
      await cloudflareManager.stop();
      db.updateSettings({ cloudflare_tunnel_url: null, cloudflare_enabled: false });
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.get('/tunnel/status', (_req, res) => {
    try { res.json({ success: true, data: cloudflareManager.getStatus() }); }
    catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  return router;
}
