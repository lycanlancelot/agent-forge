import { CloudflareManager } from '../services/CloudflareManager';
import { AppDatabase } from '../services/Database';

const DB_PATH = process.env.DB_PATH || './data/agentforge.db';

async function main() {
  const db = new AppDatabase(DB_PATH);
  const settings = db.getSettings();
  const manager = new CloudflareManager(settings);
  await manager.stop();
  db.updateSettings({ cloudflare_tunnel_url: null, cloudflare_enabled: false });
  console.log('Tunnel stopped');
}

main();
