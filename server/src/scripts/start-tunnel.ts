import { CloudflareManager } from '../services/CloudflareManager';
import { AppDatabase } from '../services/Database';

const PORT = parseInt(process.env.PORT || '3000', 10);
const DB_PATH = process.env.DB_PATH || './data/agentforge.db';

async function main() {
  const db = new AppDatabase(DB_PATH);
  const settings = db.getSettings();
  const manager = new CloudflareManager(settings);
  try {
    const url = await manager.start(PORT);
    console.log('Tunnel started:', url);
    db.updateSettings({ cloudflare_tunnel_url: url, cloudflare_enabled: true });
  } catch (err: any) {
    console.error('Failed to start tunnel:', err.message);
    process.exit(1);
  }
}

main();
