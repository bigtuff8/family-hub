"""
Amazon Alexa Shopping List client using direct HTTP requests.
Location: services/alexa-sync/amazon_client.py

Uses httpx to call Amazon's internal shopping list API directly with
session cookies. No browser needed - CORS is a browser-only restriction,
so server-side HTTP requests work fine with the right cookies and headers.
"""

import logging
from typing import Optional

from cookie_manager import CookieManager

import httpx

logger = logging.getLogger(__name__)

# Headers to mimic a browser request
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/133.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
    "Accept-Language": "en-GB,en;q=0.9",
}


class AmazonClient:
    """HTTP-based client for Amazon's Alexa shopping list API."""

    def __init__(self, domain: str, cookie_manager: CookieManager, password: str = ""):
        self.domain = domain
        self.base_domain = domain.removeprefix("www.")
        self.alexa_domain = f"alexa.{self.base_domain}"
        self.cookie_manager = cookie_manager
        self._shopping_list_id: Optional[str] = None
        self._authenticated = False

    def _build_client(self) -> httpx.AsyncClient:
        """Create an httpx client with Amazon cookies loaded."""
        cookies_dict = self.cookie_manager.get_cookies()
        cookies = httpx.Cookies()
        if cookies_dict:
            for name, value in cookies_dict.items():
                cookies.set(name, str(value), domain=f".{self.base_domain}")
        return httpx.AsyncClient(
            cookies=cookies,
            headers=DEFAULT_HEADERS,
            timeout=30.0,
            follow_redirects=True,
        )

    async def _ensure_authenticated(self) -> bool:
        """
        Verify Amazon session is valid by calling the bootstrap API.
        Returns True if cookies are still valid.
        """
        if self._authenticated:
            return True

        cookies_dict = self.cookie_manager.get_cookies()
        if not cookies_dict:
            logger.error("No cookies available")
            return False

        try:
            async with self._build_client() as client:
                resp = await client.get(
                    f"https://{self.alexa_domain}/api/bootstrap",
                    headers={**DEFAULT_HEADERS, "Referer": f"https://{self.alexa_domain}/spa/index.html"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    email = data.get("authentication", {}).get("customerEmail", "unknown")
                    logger.info(f"Amazon session valid: {email}")
                    self._authenticated = True
                    return True

                if resp.status_code in (401, 403):
                    logger.error("Amazon cookies expired - need fresh cookies")
                    return False

                # Redirect to sign-in page means cookies expired
                final_url = str(resp.url)
                if "signin" in final_url or "ap/signin" in final_url:
                    logger.error("Redirected to sign-in - cookies expired")
                    return False

                logger.warning(f"Unexpected bootstrap response: {resp.status_code}")
                # Still try the API - bootstrap might not work but list API might
                self._authenticated = True
                return True

        except Exception as e:
            logger.error(f"Auth check failed: {e}")
            return False

    async def get_shopping_list_id(self) -> Optional[str]:
        """Find the Alexa shopping list ID."""
        if self._shopping_list_id:
            return self._shopping_list_id

        if not await self._ensure_authenticated():
            return None

        try:
            async with self._build_client() as client:
                resp = await client.post(
                    f"https://{self.domain}/alexashoppinglists/api/v2/lists/fetch",
                    headers={
                        **DEFAULT_HEADERS,
                        "Content-Type": "application/json",
                        "Referer": f"https://{self.domain}/alexaquantum/sp/alexaShoppingList",
                        "Origin": f"https://{self.domain}",
                    },
                    json={
                        "listAttributesToAggregate": [{"type": "totalActiveItemsCount"}],
                        "listOwnershipType": None,
                    },
                )

                if not resp.is_success:
                    logger.error(f"List fetch failed: {resp.status_code} {resp.text[:200]}")
                    self._authenticated = False
                    return None

                data = resp.json()
                lists = data.get("listInfoList", [])

                for lst in lists:
                    list_type = lst.get("listType", "")
                    list_name = lst.get("listName", "").lower()
                    if list_type == "SHOPPING_ITEM" or "shopping" in list_name:
                        self._shopping_list_id = lst.get("listId")
                        logger.info(f"Found shopping list: {lst.get('listName')} (ID: {self._shopping_list_id})")
                        return self._shopping_list_id

                if lists:
                    self._shopping_list_id = lists[0].get("listId")
                    logger.info(f"Using first list as fallback (ID: {self._shopping_list_id})")
                    return self._shopping_list_id

                logger.error("No shopping lists found in response")
                return None

        except Exception as e:
            logger.error(f"Failed to get shopping list ID: {e}")
            return None

    async def get_items(self) -> Optional[list[dict]]:
        """Get all items from the Alexa shopping list."""
        list_id = await self.get_shopping_list_id()
        if not list_id:
            return None

        try:
            async with self._build_client() as client:
                resp = await client.post(
                    f"https://{self.domain}/alexashoppinglists/api/v2/lists/{list_id}/items/fetch",
                    headers={
                        **DEFAULT_HEADERS,
                        "Content-Type": "application/json",
                        "Referer": f"https://{self.domain}/alexaquantum/sp/alexaShoppingList",
                        "Origin": f"https://{self.domain}",
                    },
                    json={
                        "maxResults": 100,
                        "itemAttributesToProject": ["quantity", "note"],
                    },
                )

                if not resp.is_success:
                    logger.error(f"Items fetch failed: {resp.status_code} {resp.text[:200]}")
                    self._authenticated = False
                    return None

                data = resp.json()
                items = data.get("itemInfoList", [])

                normalized = []
                for item in items:
                    normalized.append({
                        "itemId": item.get("itemId", ""),
                        "value": item.get("itemName", ""),
                        "completed": item.get("itemStatus", "ACTIVE") == "COMPLETE",
                        "version": item.get("version", 1),
                    })

                return normalized

        except Exception as e:
            logger.error(f"Failed to fetch items: {e}")
            return None

    async def get_active_items(self) -> Optional[list[dict]]:
        """Get only uncompleted items."""
        items = await self.get_items()
        if items is None:
            return None
        return [i for i in items if not i.get("completed", False)]

    async def add_item(self, name: str) -> bool:
        """Add an item to the Amazon shopping list."""
        list_id = await self.get_shopping_list_id()
        if not list_id:
            return False

        try:
            async with self._build_client() as client:
                resp = await client.post(
                    f"https://{self.domain}/alexashoppinglists/api/v2/lists/{list_id}/items",
                    headers={
                        **DEFAULT_HEADERS,
                        "Content-Type": "application/json",
                        "Referer": f"https://{self.domain}/alexaquantum/sp/alexaShoppingList",
                        "Origin": f"https://{self.domain}",
                    },
                    json={
                        "items": [{"itemType": "KEYWORD", "itemName": name}],
                    },
                )

                if resp.is_success:
                    logger.info(f"Added to Amazon list: {name}")
                    return True

                logger.warning(f"Failed to add item '{name}': {resp.status_code}")
                return False

        except Exception as e:
            logger.error(f"Failed to add item '{name}': {e}")
            return False

    async def delete_item(self, item_id: str, version: int = 1) -> bool:
        """Delete an item from the Amazon shopping list."""
        list_id = await self.get_shopping_list_id()
        if not list_id:
            return False

        try:
            async with self._build_client() as client:
                resp = await client.delete(
                    f"https://{self.domain}/alexashoppinglists/api/v2/lists/{list_id}/items/{item_id}",
                    params={"version": version},
                    headers={
                        **DEFAULT_HEADERS,
                        "Referer": f"https://{self.domain}/alexaquantum/sp/alexaShoppingList",
                        "Origin": f"https://{self.domain}",
                    },
                )

                if resp.is_success:
                    logger.info(f"Deleted from Amazon list: item {item_id}")
                    return True

                logger.warning(f"Failed to delete item {item_id}: {resp.status_code}")
                return False

        except Exception as e:
            logger.error(f"Failed to delete item {item_id}: {e}")
            return False

    async def is_authenticated(self) -> bool:
        """Check if current cookies are valid."""
        self._authenticated = False  # Force re-check
        return await self._ensure_authenticated()

    async def stop(self):
        """No-op - no browser to shut down."""
        pass
