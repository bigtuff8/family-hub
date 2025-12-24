# Mobile Access Setup Guide

**Location:** docs/mobile-access-setup.md
**Created:** December 23, 2025

This guide explains how to access Family Hub from mobile devices both on the local network and remotely via Tailscale.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Raspberry Pi                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Docker Network                        │    │
│  │                                                          │    │
│  │   ┌─────────┐     ┌──────────┐     ┌──────────────┐     │    │
│  │   │ Caddy   │────►│ Frontend │     │   Backend    │     │    │
│  │   │ :80/443 │     │  :3000   │     │    :8000     │     │    │
│  │   └────┬────┘     └──────────┘     └──────────────┘     │    │
│  │        │                                  ▲              │    │
│  │        │          /api/* ─────────────────┘              │    │
│  │        │          /* ──────────────────────►             │    │
│  └────────┼─────────────────────────────────────────────────┘    │
│           │                                                       │
└───────────┼───────────────────────────────────────────────────────┘
            │
    ┌───────┴───────┐
    │   Port 80     │
    └───────┬───────┘
            │
    ┌───────┴───────────────────────────┐
    │                                    │
    ▼                                    ▼
┌────────────┐                   ┌──────────────┐
│ Local LAN  │                   │  Tailscale   │
│ 192.168.x  │                   │  100.x.x.x   │
└────────────┘                   └──────────────┘
```

## How It Works

1. **Caddy** acts as a reverse proxy on port 80
2. Requests to `/api/*` are forwarded to the backend (port 8000)
3. All other requests are forwarded to the frontend (port 3000)
4. Frontend uses **relative URLs** (`/api/v1/...`) instead of `http://localhost:8000`
5. This means the frontend works from ANY device accessing the Pi

---

## Deployment Steps

### Step 1: Pull Latest Code on Pi

```bash
cd ~/family-hub
git pull origin main
```

### Step 2: Restart Docker Services

```bash
docker-compose down
docker-compose up -d --build
```

This will:
- Build the updated frontend with relative URLs
- Start the new Caddy reverse proxy
- Start backend and database

### Step 3: Verify Services Running

```bash
docker-compose ps
```

You should see 4 services running:
- `familyhub-caddy` - Reverse proxy (ports 80, 443)
- `familyhub-frontend` - React app
- `familyhub-backend` - FastAPI
- `familyhub-db` - PostgreSQL

### Step 4: Test Local Access

From any device on your local network, open a browser and go to:
```
http://<pi-ip-address>/
```

For example: `http://192.168.1.50/`

---

## Tailscale Setup for Remote Access

### Option A: Basic Tailscale (Already Installed)

If Tailscale is already installed and connected, Family Hub should be accessible via the Pi's Tailscale IP:

```
http://100.x.x.x/
```

Find your Pi's Tailscale IP:
```bash
tailscale ip -4
```

### Option B: Tailscale Serve (Recommended for HTTPS)

Tailscale Serve provides automatic HTTPS with a subdomain on your Tailnet.

```bash
# Expose port 80 via Tailscale Serve
tailscale serve --bg 80
```

This creates a URL like: `https://pi-hostname.tailnet-name.ts.net/`

To see your Tailscale Serve URL:
```bash
tailscale serve status
```

### Option C: Tailscale Funnel (Public Internet Access)

If you want to access from non-Tailscale devices (not recommended for security):

```bash
tailscale funnel 80
```

---

## Accessing from Mobile

### On Local WiFi
1. Connect to your home WiFi
2. Open browser (Chrome/Safari)
3. Go to `http://<pi-local-ip>/`

### Via Tailscale (Remote)
1. Ensure Tailscale app is installed and connected on your phone
2. Open browser
3. Go to `http://<pi-tailscale-ip>/` or `https://pi.tailnet.ts.net/`

---

## Troubleshooting

### "Connection Refused" on Mobile

1. Check Caddy is running: `docker-compose ps`
2. Check Pi firewall allows port 80: `sudo ufw status`
3. If using Tailscale, ensure phone is connected to Tailnet

### API Calls Failing

1. Check backend is running: `docker-compose logs backend`
2. Test API directly: `curl http://localhost:8000/health`
3. Check Caddy logs: `docker-compose logs caddy`

### Caddy Not Starting

1. Check Caddyfile syntax: `docker-compose logs caddy`
2. Ensure port 80 is free: `sudo lsof -i :80`

### Reseed Database (if needed)

If user names need updating to show proper initials:
```bash
docker-compose exec backend python seed.py
```

---

## Security Notes

- **Local Network**: Anyone on your WiFi can access Family Hub
- **Tailscale**: Only devices on your Tailnet can access
- **HTTPS**: Use Tailscale Serve for automatic HTTPS
- **Passwords**: Change default JWT_SECRET in production

---

## Files Changed for Mobile Access

| File | Change |
|------|--------|
| `docker-compose.yml` | Added Caddy service, changed VITE_API_URL to empty |
| `Caddyfile` | New file - reverse proxy configuration |
| `frontend/.env` | Changed VITE_API_URL to empty |
| `frontend/src/services/api.ts` | Uses relative URL |
| `frontend/src/services/auth.ts` | Uses relative URLs |

---

## Rolling Back

If something goes wrong, revert to the old setup:

```bash
# Revert changes
git checkout -- docker-compose.yml frontend/.env frontend/src/services/api.ts frontend/src/services/auth.ts
rm Caddyfile

# Restart without Caddy
docker-compose down
docker-compose up -d

# Access via old URLs
# Frontend: http://pi-ip:3000
# Backend: http://pi-ip:8000
```
