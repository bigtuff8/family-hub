#!/bin/bash
# ============================================================
# Family Hub Kiosk Mode
# ============================================================
# Launches Firefox in fullscreen kiosk mode pointing at the
# Family Hub frontend. Waits for the app to be ready first.
#
# Location on Pi: /home/bigtuff8/kiosk.sh
# Triggered by: ~/.config/autostart/kiosk.desktop
# Managed via: Settings > System > Kiosk Mode in the app
#
# To manually control:
#   Start:   bash ~/kiosk.sh
#   Stop:    pkill firefox
#   Status:  pgrep -f "firefox.*--kiosk"
# ============================================================

# Wayland environment
export XDG_RUNTIME_DIR=/run/user/1000
export WAYLAND_DISPLAY=wayland-0
export MOZ_ENABLE_WAYLAND=1

FRONTEND_URL="http://localhost:3000"
MAX_WAIT=120  # seconds
CHECK_INTERVAL=2

echo "[kiosk] Waiting for Family Hub frontend at ${FRONTEND_URL}..."

elapsed=0
while [ $elapsed -lt $MAX_WAIT ]; do
    status=$(curl -s -o /dev/null -w '%{http_code}' "$FRONTEND_URL" 2>/dev/null)
    if [ "$status" = "200" ]; then
        echo "[kiosk] Frontend ready after ${elapsed}s"
        break
    fi
    sleep $CHECK_INTERVAL
    elapsed=$((elapsed + CHECK_INTERVAL))
done

if [ $elapsed -ge $MAX_WAIT ]; then
    echo "[kiosk] WARNING: Frontend not ready after ${MAX_WAIT}s, launching anyway"
fi

# Extra settle time for frontend JS to load
sleep 3

# Screen sleep after 30 seconds using swayidle (Wayland)
pkill swayidle 2>/dev/null
swayidle -w \
    timeout 30 'wlopm --off \*' \
    resume 'wlopm --on \*' &

# Hide cursor when idle
pkill unclutter 2>/dev/null
unclutter -idle 0.5 -root &

echo "[kiosk] Launching Firefox in kiosk mode..."
firefox --kiosk "$FRONTEND_URL"

echo "[kiosk] Firefox exited"
