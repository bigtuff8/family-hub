"""
Amazon Alexa Shopping List client using session cookies.
Location: services/alexa-sync/amazon_client.py

Reads and writes to Amazon's internal web API for shopping lists.
These are undocumented endpoints used by the Alexa web app itself.
"""

import logging
from typing import Optional

import httpx

from cookie_manager import CookieManager

logger = logging.getLogger(__name__)

# Amazon's internal Alexa list API base
ALEXA_LIST_API = "https://{domain}/alexaquantum/api"


class AmazonClient:
    """Client for Amazon's internal Alexa shopping list web API."""

    def __init__(self, domain: str, cookie_manager: CookieManager):
        self.domain = domain
        self.cookie_manager = cookie_manager
        self.base_url = ALEXA_LIST_API.format(domain=domain)
        self._shopping_list_id: Optional[str] = None

    def _get_headers(self) -> dict:
        """Standard headers to mimic browser requests."""
        return {
            "User-Agent": "Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Accept-Language": "en-GB,en;q=0.9",
            "Referer": f"https://{self.domain}/alexaquantum/sp/alexaShoppingList",
            "Origin": f"https://{self.domain}",
        }

    async def _request(self, method: str, path: str, **kwargs) -> Optional[dict]:
        """Make an authenticated request to Amazon's API."""
        cookies = self.cookie_manager.get_cookies()
        if not cookies:
            logger.error("No cookies available - cannot make request")
            return None

        url = f"{self.base_url}{path}"

        try:
            async with httpx.AsyncClient(cookies=cookies, timeout=30.0) as client:
                response = await client.request(
                    method, url,
                    headers=self._get_headers(),
                    **kwargs
                )

                if response.status_code in (401, 403):
                    logger.error(f"Auth failed ({response.status_code}) - cookies likely expired")
                    self.cookie_manager.clear_cookies()
                    return None

                if response.status_code == 200:
                    return response.json()

                logger.warning(f"Unexpected status {response.status_code} for {method} {path}")
                return None

        except httpx.TimeoutException:
            logger.error(f"Timeout on {method} {path}")
            return None
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return None

    async def get_shopping_list_id(self) -> Optional[str]:
        """Find the default Alexa shopping list ID."""
        if self._shopping_list_id:
            return self._shopping_list_id

        data = await self._request("GET", "/lists")
        if not data:
            return None

        # Find the shopping list (usually named "Alexa shopping list" or has type "SHOPPING_LIST")
        lists = data.get("lists", data) if isinstance(data, dict) else data
        if isinstance(lists, list):
            for lst in lists:
                list_type = lst.get("listType", lst.get("type", ""))
                if list_type == "SHOPPING_LIST" or "shopping" in lst.get("name", "").lower():
                    self._shopping_list_id = lst.get("listId", lst.get("id"))
                    logger.info(f"Found shopping list: {lst.get('name')} (ID: {self._shopping_list_id})")
                    return self._shopping_list_id

            # Fallback: use the default list
            for lst in lists:
                if lst.get("defaultList", False):
                    self._shopping_list_id = lst.get("listId", lst.get("id"))
                    logger.info(f"Using default list: {lst.get('name')} (ID: {self._shopping_list_id})")
                    return self._shopping_list_id

        logger.error(f"Could not find shopping list in response: {data}")
        return None

    async def get_items(self) -> Optional[list[dict]]:
        """
        Get all items from the Alexa shopping list.
        Returns list of: {"itemId": str, "value": str, "completed": bool}
        """
        list_id = await self.get_shopping_list_id()
        if not list_id:
            return None

        data = await self._request("GET", f"/{list_id}/items")
        if data is None:
            return None

        items = data.get("items", data) if isinstance(data, dict) else data
        if not isinstance(items, list):
            logger.error(f"Unexpected items format: {type(items)}")
            return None

        # Normalize item format
        result = []
        for item in items:
            result.append({
                "itemId": item.get("itemId", item.get("id", "")),
                "value": item.get("value", item.get("name", "")),
                "completed": item.get("completed", item.get("checked", False)),
            })

        return result

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

        data = await self._request(
            "POST",
            f"/{list_id}/items",
            json={"value": name}
        )
        if data:
            logger.info(f"Added to Amazon list: {name}")
            return True
        return False

    async def delete_item(self, item_id: str) -> bool:
        """Delete an item from the Amazon shopping list."""
        list_id = await self.get_shopping_list_id()
        if not list_id:
            return False

        data = await self._request("DELETE", f"/{list_id}/items/{item_id}")
        # DELETE might return empty response on success
        logger.info(f"Deleted from Amazon list: item {item_id}")
        return True

    async def is_authenticated(self) -> bool:
        """Check if current cookies are valid."""
        data = await self._request("GET", "/lists")
        return data is not None
