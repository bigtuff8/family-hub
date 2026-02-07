"""
Admin API routes - system management endpoints.
Includes kiosk mode control for the Pi touchscreen.
"""

import subprocess
import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.auth.security import get_current_user

router = APIRouter()

KIOSK_SCRIPT = Path.home() / "kiosk.sh"
AUTOSTART_DIR = Path.home() / ".config" / "autostart"
KIOSK_DESKTOP = AUTOSTART_DIR / "kiosk.desktop"
KIOSK_DESKTOP_DISABLED = AUTOSTART_DIR / "kiosk.desktop.disabled"

KIOSK_DESKTOP_CONTENT = """[Desktop Entry]
Type=Application
Name=Family Hub Kiosk
Comment=Launch Family Hub in kiosk mode
Exec={kiosk_script}
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
    """Check if Firefox is running in kiosk mode."""
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
    """Check if kiosk autostart is enabled."""
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
    """Exit kiosk mode by killing Firefox."""
    running, pid = _is_firefox_kiosk_running()
    if not running:
        return KioskActionResponse(success=True, message="Kiosk is not running")

    try:
        subprocess.run(["pkill", "-f", "firefox"], timeout=10)
        return KioskActionResponse(success=True, message="Kiosk mode exited")
    except subprocess.TimeoutExpired:
        return KioskActionResponse(success=False, message="Timeout killing Firefox")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to exit kiosk: {str(e)}")


@router.post("/kiosk/start", response_model=KioskActionResponse)
async def start_kiosk(current_user=Depends(get_current_user)):
    """Start kiosk mode by launching the kiosk script."""
    running, _ = _is_firefox_kiosk_running()
    if running:
        return KioskActionResponse(success=True, message="Kiosk is already running")

    if not KIOSK_SCRIPT.exists():
        raise HTTPException(status_code=404, detail="Kiosk script not found")

    try:
        # Launch kiosk script in background (detached)
        subprocess.Popen(
            ["bash", str(KIOSK_SCRIPT)],
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
            KIOSK_DESKTOP.write_text(
                KIOSK_DESKTOP_CONTENT.format(kiosk_script=str(KIOSK_SCRIPT))
            )

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
