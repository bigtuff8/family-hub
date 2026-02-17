"""
Family Hub API client for the sync service.
Location: services/alexa-sync/familyhub_client.py
"""

import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


class FamilyHubClient:
    """Client for Family Hub's service shopping endpoints."""

    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key

    def _headers(self) -> dict:
        return {"X-API-Key": self.api_key}

    async def get_items(self) -> Optional[list[dict]]:
        """Get unchecked items from the default shopping list."""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    f"{self.base_url}/api/v1/shopping/service/items",
                    headers=self._headers()
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.error(f"Failed to get FH items: {e}")
            return None

    async def get_all_items(self) -> Optional[list[dict]]:
        """Get ALL items (including checked) for sync comparison."""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    f"{self.base_url}/api/v1/shopping/service/items/all",
                    headers=self._headers()
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.error(f"Failed to get all FH items: {e}")
            return None

    async def add_items(self, items: list[dict]) -> Optional[dict]:
        """Add items to the default shopping list."""
        if not items:
            return {"added": 0, "merged": 0, "skipped": 0, "details": []}

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    f"{self.base_url}/api/v1/shopping/service/items",
                    headers=self._headers(),
                    json={"items": items}
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.error(f"Failed to add FH items: {e}")
            return None

    async def check_items(self, names: list[str]) -> Optional[dict]:
        """Mark items as checked by name."""
        if not names:
            return {"checked": 0}

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    f"{self.base_url}/api/v1/shopping/service/items/check",
                    headers=self._headers(),
                    json={"names": names}
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.error(f"Failed to check FH items: {e}")
            return None

    async def update_sync_status(
        self,
        status: str,
        error: Optional[str] = None,
        items_imported: int = 0,
        items_exported: int = 0,
        cookie_status: Optional[str] = None
    ) -> bool:
        """Update the sync status in Family Hub."""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.put(
                    f"{self.base_url}/api/v1/shopping/service/sync-status",
                    headers=self._headers(),
                    json={
                        "last_sync_status": status,
                        "last_sync_error": error,
                        "items_imported": items_imported,
                        "items_exported": items_exported,
                        "cookie_status": cookie_status,
                    }
                )
                resp.raise_for_status()
                return True
        except Exception as e:
            logger.error(f"Failed to update sync status: {e}")
            return False
