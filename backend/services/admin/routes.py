"""
Admin API routes - system management endpoints.
Includes kiosk mode control for the Pi touchscreen.

NOTE: The backend runs inside Docker. To interact with the host:
- pid: "host" in docker-compose.yml lets us see host processes (pgrep/pkill)
- /host-autostart is bind-mounted to ~/.config/autostart on the host
- nsenter is used to run commands in the host's namespace (for starting kiosk)
"""

import subprocess
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.auth.security import get_current_user

router = APIRouter()

# Paths inside the container (bind-mounted from host)
AUTOSTART_DIR = Path("/host-autostart")
KIOSK_DESKTOP = AUTOSTART_DIR / "kiosk.desktop"
KIOSK_DESKTOP_DISABLED = AUTOSTART_DIR / "kiosk.desktop.disabled"

# Path on the host filesystem (used with nsenter)
HOST_KIOSK_SCRIPT = "/home/bigtuff8/kiosk.sh"

KIOSK_DESKTOP_CONTENT = """[Desktop Entry]
Type=Application
Name=Family Hub Kiosk
Comment=Launch Family Hub in kiosk mode
Exec=/home/bigtuff8/kiosk.sh
Terminal=false
X-GNOME-Autostart-enabled=true
"""


class KioskStatusResponse(BaseModel):
    running: bool
    autostart_enabled: bool
    pid: int | None = None


class KioskActionResponse(BaseModel):
    success: bool
    message: str


def _is_firefox_kiosk_running() -> tuple[bool, int | None]:
    """Check if Firefox is running in kiosk mode.
    Works because docker-compose has pid: host."""
    try:
        result = subprocess.run(
            ["pgrep", "-f", "firefox.*--kiosk"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0 and result.stdout.strip():
            pid = int(result.stdout.strip().split('\n')[0])
            return True, pid
        return False, None
    except Exception:
        return False, None


def _is_autostart_enabled() -> bool:
    """Check if kiosk autostart is enabled.
    Works because /host-autostart is bind-mounted."""
    return KIOSK_DESKTOP.exists()


@router.get("/kiosk/status", response_model=KioskStatusResponse)
async def get_kiosk_status(current_user=Depends(get_current_user)):
    """Get current kiosk mode status."""
    running, pid = _is_firefox_kiosk_running()
    return KioskStatusResponse(
        running=running,
        autostart_enabled=_is_autostart_enabled(),
        pid=pid
    )


@router.post("/kiosk/exit", response_model=KioskActionResponse)
async def exit_kiosk(current_user=Depends(get_current_user)):
    """Exit kiosk mode by killing Firefox on the host."""
    running, pid = _is_firefox_kiosk_running()
    if not running:
        return KioskActionResponse(success=True, message="Kiosk is not running")

    try:
        # pkill works directly because of pid: host
        subprocess.run(["pkill", "-f", "firefox"], timeout=10)
        return KioskActionResponse(success=True, message="Kiosk mode exited")
    except subprocess.TimeoutExpired:
        return KioskActionResponse(success=False, message="Timeout killing Firefox")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to exit kiosk: {str(e)}")


@router.post("/kiosk/start", response_model=KioskActionResponse)
async def start_kiosk(current_user=Depends(get_current_user)):
    """Start kiosk mode by launching the kiosk script on the host.
    Uses nsenter to execute in the host's namespace."""
    running, _ = _is_firefox_kiosk_running()
    if running:
        return KioskActionResponse(success=True, message="Kiosk is already running")

    try:
        # Use nsenter to run the kiosk script in the host's namespace as bigtuff8
        # --target 1: PID 1 (host init) --mount: host mount namespace
        cmd = (
            f"export XDG_RUNTIME_DIR=/run/user/1000 "
            f"WAYLAND_DISPLAY=wayland-0 "
            f"MOZ_ENABLE_WAYLAND=1; "
            f"bash {HOST_KIOSK_SCRIPT} &"
        )
        subprocess.Popen(
            [
                "nsenter", "--target", "1", "--mount", "--uts", "--ipc", "--pid",
                "--", "su", "-", "bigtuff8", "-c", cmd
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True
        )
        return KioskActionResponse(success=True, message="Kiosk mode starting")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start kiosk: {str(e)}")


@router.post("/kiosk/autostart/enable", response_model=KioskActionResponse)
async def enable_kiosk_autostart(current_user=Depends(get_current_user)):
    """Enable kiosk mode on boot."""
    if _is_autostart_enabled():
        return KioskActionResponse(success=True, message="Autostart already enabled")

    try:
        AUTOSTART_DIR.mkdir(parents=True, exist_ok=True)

        # If disabled version exists, rename it back
        if KIOSK_DESKTOP_DISABLED.exists():
            KIOSK_DESKTOP_DISABLED.rename(KIOSK_DESKTOP)
        else:
            # Create fresh desktop entry
            KIOSK_DESKTOP.write_text(KIOSK_DESKTOP_CONTENT)

        return KioskActionResponse(success=True, message="Kiosk autostart enabled")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to enable autostart: {str(e)}")


@router.post("/kiosk/autostart/disable", response_model=KioskActionResponse)
async def disable_kiosk_autostart(current_user=Depends(get_current_user)):
    """Disable kiosk mode on boot."""
    if not _is_autostart_enabled():
        return KioskActionResponse(success=True, message="Autostart already disabled")

    try:
        KIOSK_DESKTOP.rename(KIOSK_DESKTOP_DISABLED)
        return KioskActionResponse(success=True, message="Kiosk autostart disabled")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to disable autostart: {str(e)}")
