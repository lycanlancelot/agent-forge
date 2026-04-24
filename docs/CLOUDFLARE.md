# Cloudflare Tunnel Setup

AgentForge integrates Cloudflare Tunnel for secure remote access without opening router ports.

## Quick Start (No Account Required)

1. Install `cloudflared` on Windows:
   ```powershell
   choco install cloudflared
   # or winget install Cloudflare.cloudflared
   ```
2. Open AgentForge → **Settings** → **Cloudflare** tab
3. Click **Start** — a `*.trycloudflare.com` URL will appear
4. Access your dashboard from anywhere using that URL

## Custom Domain (Permanent)

1. Sign up at https://dash.cloudflare.com
2. Add your domain
3. Create a tunnel token:
   ```bash
   cloudflared tunnel login
   cloudflared tunnel create agentforge
   cloudflared tunnel token <tunnel-id>
   ```
4. Paste the token in AgentForge Settings
5. Enter your hostname (e.g., `forge.yourdomain.com`)
6. Click **Start**

## Australia Performance Tips

- Cloudflare's Sydney (SYD) and Melbourne (MEL) edge nodes provide lowest latency
- Tunnel auto-connects to the nearest edge
- Quick Tunnels have a ~200 concurrent request limit (sufficient for personal use)
