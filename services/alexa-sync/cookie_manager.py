"""
Manages Amazon session cookies for API access.
Location: services/alexa-sync/cookie_manager.py
"""

import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


class CookieManager:
    """Loads and validates Amazon session cookies from a JSON file."""

    def __init__(self, cookies_file: str):
        self.cookies_file = Path(cookies_file)
        self._cookies: Optional[dict] = None

    def load_cookies(self) -> Optional[dict]:
        """Load cookies from file. Returns dict suitable for httpx cookies param."""
        if not self.cookies_file.exists():
            logger.warning(f"Cookie file not found: {self.cookies_file}")
            return None

        try:
            with open(self.cookies_file) as f:
                data = json.load(f)

            # Support both list-of-dicts format (Selenium) and simple dict format
            if isinstance(data, list):
                # Selenium cookie format: [{"name": "x", "value": "y", "domain": "..."}, ...]
                cookies = {}
                for cookie in data:
                    if "amazon" in cookie.get("domain", ""):
                        cookies[cookie["name"]] = cookie["value"]
                self._cookies = cookies
            elif isinstance(data, dict):
                self._cookies = data
            else:
                logger.error(f"Unexpected cookie file format: {type(data)}")
                return None

            logger.info(f"Loaded {len(self._cookies)} Amazon cookies")
            return self._cookies

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse cookie file: {e}")
            return None
        except Exception as e:
            logger.error(f"Failed to load cookies: {e}")
            return None

    def get_cookies(self) -> Optional[dict]:
        """Get cached cookies or load from file."""
        if self._cookies is None:
            return self.load_cookies()
        return self._cookies

    def clear_cookies(self):
        """Clear cached cookies (force reload on next access)."""
        self._cookies = None

    @property
    def status(self) -> str:
        """Get cookie status: 'valid', 'not_configured', or 'expired'."""
        if not self.cookies_file.exists():
            return "not_configured"
        cookies = self.get_cookies()
        if not cookies:
            return "not_configured"
        # We can't easily check expiry without trying - return 'valid'
        # The amazon_client will update this to 'expired' if requests fail
        return "valid"
