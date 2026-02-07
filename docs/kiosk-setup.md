# Kiosk Mode - Setup & Management

**Last Updated:** 7 February 2026

---

## Overview

Family Hub runs in "kiosk mode" on the Raspberry Pi touchscreen - Firefox launches fullscreen with no browser chrome (no address bar, tabs, or menu). This gives a clean, app-like experience on the touchscreen.

---

## How It Works

### Components

| Component | Location on Pi | Purpose |
|-----------|---------------|---------|
| `kiosk.sh` | `/home/bigtuff8/kiosk.sh` | Script that waits for the app and launches Firefox |
| `kiosk.desktop` | `~/.config/autostart/kiosk.desktop` | XDG autostart entry (runs kiosk.sh on login) |
| Admin API | `/api/v1/admin/kiosk/*` | Backend endpoints to control kiosk from the app |
| Settings UI | Settings > System > Kiosk Mode | Frontend controls for kiosk mode |

### Boot Sequence

1. Pi boots, **LightDM** starts the display manager
2. **labwc** (Wayland compositor) launches as the window manager
3. labwc runs `lxsession-xdg-autostart` which reads `~/.config/autostart/`
4. `kiosk.desktop` runs `kiosk.sh`
5. `kiosk.sh` polls `http://localhost:3000` until the frontend responds (up to 2 mins)
6. Firefox launches with `--kiosk` flag (fullscreen, no UI chrome)

### Desktop Environment Details

- **Display Manager:** LightDM
- **Compositor:** labwc (Wayland)
- **Session:** LXDE-pi variant
- **Keyboard shortcut for terminal:** Ctrl+Alt+T

---

## Managing Kiosk Mode

### From the Touchscreen (Recommended)

1. Navigate to **Settings** (avatar dropdown > Settings)
2. Go to **System** section
3. Under **Kiosk Mode**:
   - **Exit Kiosk Mode** - closes fullscreen Firefox, shows the desktop
   - **Enter Kiosk Mode** - re-launches Firefox fullscreen
   - **Start on Boot** - toggle whether kiosk starts automatically on reboot

### From SSH

```bash
# Check if kiosk is running
pgrep -f "firefox.*--kiosk"

# Stop kiosk (kill Firefox)
pkill firefox

# Start kiosk
bash ~/kiosk.sh &

# Disable autostart
mv ~/.config/autostart/kiosk.desktop ~/.config/autostart/kiosk.desktop.disabled

# Enable autostart
mv ~/.config/autostart/kiosk.desktop.disabled ~/.config/autostart/kiosk.desktop
```

### From the Pi's Physical Keyboard (if connected)

- **Ctrl+Alt+T** - Open terminal (labwc keybinding)
- **Ctrl+Alt+Delete** - Open shutdown dialog (labwc keybinding)

---

## Initial Setup (First Time)

If setting up kiosk mode on a fresh Pi:

```bash
# 1. Copy the kiosk script from the repo
cp ~/family-hub/kiosk/kiosk.sh ~/kiosk.sh
chmod +x ~/kiosk.sh

# 2. Create autostart directory if needed
mkdir -p ~/.config/autostart

# 3. Copy the desktop entry
cp ~/family-hub/kiosk/kiosk.desktop ~/.config/autostart/kiosk.desktop

# 4. Verify Docker containers are running
cd ~/family-hub
docker-compose up -d

# 5. Test kiosk (should launch Firefox fullscreen)
bash ~/kiosk.sh &

# 6. To exit: from SSH run `pkill firefox`, or use Settings > System > Exit Kiosk
```

---

## API Endpoints

All endpoints require authentication.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/kiosk/status` | Get kiosk running state and autostart config |
| POST | `/api/v1/admin/kiosk/exit` | Kill Firefox kiosk process |
| POST | `/api/v1/admin/kiosk/start` | Launch kiosk.sh in background |
| POST | `/api/v1/admin/kiosk/autostart/enable` | Enable kiosk on boot |
| POST | `/api/v1/admin/kiosk/autostart/disable` | Disable kiosk on boot |

---

## Files in the Repo

The `kiosk/` directory in the repo contains reference copies:

- `kiosk/kiosk.sh` - The kiosk launch script
- `kiosk/kiosk.desktop` - The autostart desktop entry

These are deployed to the Pi home directory, NOT inside the Docker containers. The Docker containers only run the web app; the kiosk script controls the browser on the host OS.

---

## Troubleshooting

### Firefox shows "Unable to connect"
- Docker containers not running: `docker-compose up -d`
- Frontend container crashed: `docker-compose logs frontend`
- Wait - kiosk.sh has a 2-minute timeout for the app to start

### Can't exit kiosk from touchscreen
- Navigate to Settings > System > Kiosk Mode > Exit
- If the app is broken, SSH in and run `pkill firefox`

### Kiosk doesn't start on boot
- Check autostart file exists: `ls ~/.config/autostart/kiosk.desktop`
- Check Docker containers start on boot: `docker-compose ps`
- Check logs: `journalctl --user -u kiosk` or check `~/.xsession-errors`

### Screen doesn't wake on touch
- `swayidle` may not be running: check `pgrep swayidle`
- The touchscreen input device may need mapping in labwc config
- Current touchscreen mapping in `~/.config/labwc/rc.xml`:
  ```xml
  <touch deviceName="Weida Hi-Tech CoolTouchR System" mapToOutput="HDMI-A-1" mouseEmulation="yes"/>
  ```
