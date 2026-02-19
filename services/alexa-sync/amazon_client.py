"""
Amazon Alexa Shopping List client using session cookies.
Location: services/alexa-sync/amazon_client.py

Reads and writes to Amazon's internal web API for shopping lists.
Uses the V2 API at /alexashoppinglists/api/v2/ (replaced the old
/alexaquantum/api/ endpoints in 2024).

Reference: Apollon77/alexa-remote (https://github.com/Apollon77/alexa-remote)
"""

import logging
import re
from typing import Optional

import httpx

from cookie_manager import CookieManager

logger = logging.getLogger(__name__)

# Amazon's V2 shopping list API
ALEXA_LIST_API_V2 = "https://{domain}/alexashoppinglists/api/v2"

# User agent mimicking the Alexa mobile app (as used by alexa-remote)
USER_AGENT = (
    "AppleWebKit PitanguiBridge/2.2.595606.0-"
    "[HARDWARE=iPhone14_7][SOFTWARE=17.4.1][DEVICE=iPhone]"
)


class AmazonClient:
    """Client for Amazon's V2 Alexa shopping list web API."""

    def __init__(self, domain: str, cookie_manager: CookieManager):
        self.domain = domain
        self.cookie_manager = cookie_manager
        self.base_url = ALEXA_LIST_API_V2.format(domain=domain)
        self._shopping_list_id: Optional[str] = None
        self._csrf_token: Optional[str] = None

    def _get_csrf_token(self, cookies: dict) -> Optional[str]:
        """Extract CSRF token from cookies."""
        if self._csrf_token:
            return self._csrf_token

        # Look for an explicit 'csrf' cookie
        csrf = cookies.get("csrf")
        if csrf:
            self._csrf_token = csrf
            return csrf

        # Some Amazon regions use different cookie names for CSRF
        for key in cookies:
            if "csrf" in key.lower():
                self._csrf_token = cookies[key]
                return self._csrf_token

        return None

    async def _ensure_csrf(self, cookies: dict) -> Optional[str]:
        """Get CSRF token, fetching from a page load if needed."""
        token = self._get_csrf_token(cookies)
        if token:
            return token

        # Load the Alexa shopping list page to get CSRF cookie
        logger.info("No CSRF token in cookies - fetching from Alexa page...")
        try:
            async with httpx.AsyncClient(
                cookies=cookies,
                timeout=30.0,
                follow_redirects=True,
            ) as client:
                resp = await client.get(
                    f"https://{self.domain}/alexaquantum/sp/alexaShoppingList",
                    headers={
                        "User-Agent": USER_AGENT,
                        "Accept": "text/html",
                        "Accept-Language": "en-GB,en;q=0.9",
                    },
                )
                # Check response cookies for CSRF
                for name, value in resp.cookies.items():
                    if "csrf" in name.lower():
                        self._csrf_token = value
                        logger.info(f"Got CSRF token from page load (cookie: {name})")
                        return self._csrf_token

                # Try to extract from page content
                match = re.search(r'"csrf"\s*:\s*"([^"]+)"', resp.text)
                if match:
                    self._csrf_token = match.group(1)
                    logger.info("Got CSRF token from page content")
                    return self._csrf_token

                # Also check meta tags
                match = re.search(r'<meta\s+name="csrf[^"]*"\s+content="([^"]+)"', resp.text)
                if match:
                    self._csrf_token = match.group(1)
                    logger.info("Got CSRF token from meta tag")
                    return self._csrf_token

        except Exception as e:
            logger.warning(f"Failed to fetch CSRF from page: {e}")

        logger.warning("Could not obtain CSRF token - requests may fail")
        return None

    def _get_headers(self, cookies: dict, with_content_type: bool = True) -> dict:
        """Standard headers for V2 API requests."""
        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "application/json; charset=utf-8",
            "Accept-Language": "en-GB",
            "Referer": f"https://alexa.{self.domain}/spa/index.html",
            "Origin": f"https://alexa.{self.domain}",
        }
        if with_content_type:
            headers["Content-Type"] = "application/json; charset=utf-8"
        if self._csrf_token:
            headers["csrf"] = self._csrf_token
        return headers

    async def _request(
        self,
        method: str,
        path: str,
        with_content_type: bool = True,
        **kwargs,
    ) -> Optional[dict]:
        """Make an authenticated request to Amazon's V2 API."""
        cookies = self.cookie_manager.get_cookies()
        if not cookies:
            logger.error("No cookies available - cannot make request")
            return None

        # Ensure CSRF token on first request
        if self._csrf_token is None:
            await self._ensure_csrf(cookies)

        url = f"{self.base_url}{path}"
        headers = self._get_headers(cookies, with_content_type)

        try:
            async with httpx.AsyncClient(
                cookies=cookies,
                timeout=30.0,
                follow_redirects=True,
            ) as client:
                response = await client.request(
                    method, url,
                    headers=headers,
                    **kwargs,
                )

                if response.status_code in (401, 403):
                    logger.error(
                        f"Auth failed ({response.status_code}) for {method} {path} - "
                        f"cookies likely expired"
                    )
                    # Try once more with fresh CSRF
                    if self._csrf_token:
                        self._csrf_token = None
                        await self._ensure_csrf(cookies)
                        if self._csrf_token:
                            headers["csrf"] = self._csrf_token
                            response = await client.request(
                                method, url, headers=headers, **kwargs,
                            )
                            if response.status_code == 200:
                                return response.json()

                    self.cookie_manager.clear_cookies()
                    return None

                if response.status_code in (200, 201):
                    if response.content:
                        return response.json()
                    return {}

                logger.warning(
                    f"Unexpected status {response.status_code} for {method} {path}: "
                    f"{response.text[:200]}"
                )
                return None

        except httpx.TimeoutException:
            logger.error(f"Timeout on {method} {path}")
            return None
        except Exception as e:
            logger.error(f"Request failed for {method} {path}: {e}")
            return None

    async def get_shopping_list_id(self) -> Optional[str]:
        """Find the default Alexa shopping list ID using V2 API."""
        if self._shopping_list_id:
            return self._shopping_list_id

        data = await self._request(
            "POST",
            "/lists/fetch",
            json={
                "listAttributesToAggregate": [
                    {"type": "totalActiveItemsCount"}
                ],
                "listOwnershipType": None,
            },
        )

        if not data:
            return None

        # V2 response uses 'listInfoList'
        lists = data.get("listInfoList", [])
        if not lists:
            # Fallback: try older response format
            lists = data.get("lists", [])

        for lst in lists:
            list_type = lst.get("listType", "")
            list_name = lst.get("listName", lst.get("name", "")).lower()
            if list_type == "SHOPPING_ITEM" or "shopping" in list_name:
                self._shopping_list_id = lst.get("listId", lst.get("id"))
                logger.info(
                    f"Found shopping list: {lst.get('listName', lst.get('name'))} "
                    f"(ID: {self._shopping_list_id})"
                )
                return self._shopping_list_id

        # Fallback: use the first list
        if lists:
            first = lists[0]
            self._shopping_list_id = first.get("listId", first.get("id"))
            logger.info(
                f"Using first list as fallback: "
                f"{first.get('listName', first.get('name'))} "
                f"(ID: {self._shopping_list_id})"
            )
            return self._shopping_list_id

        logger.error(f"Could not find shopping list in response: {data}")
        return None

    async def get_items(self) -> Optional[list[dict]]:
        """
        Get all items from the Alexa shopping list (V2 API).
        Returns list of: {"itemId": str, "value": str, "completed": bool, "version": int}
        """
        list_id = await self.get_shopping_list_id()
        if not list_id:
            return None

        data = await self._request(
            "POST",
            f"/lists/{list_id}/items/fetch?limit=200",
            json={
                "itemAttributesToProject": ["quantity", "note"],
            },
        )

        if data is None:
            return None

        # V2 response uses 'itemInfoList'
        items = data.get("itemInfoList", [])
        if not items and isinstance(data, list):
            items = data

        # Normalize item format to match what sync_engine expects
        result = []
        for item in items:
            result.append({
                "itemId": item.get("itemId", item.get("id", "")),
                "value": item.get("itemName", item.get("value", item.get("name", ""))),
                "completed": item.get("itemStatus", "ACTIVE") == "COMPLETE",
                "version": item.get("version", 1),
            })

        return result

    async def get_active_items(self) -> Optional[list[dict]]:
        """Get only uncompleted items."""
        items = await self.get_items()
        if items is None:
            return None
        return [i for i in items if not i.get("completed", False)]

    async def add_item(self, name: str) -> bool:
        """Add an item to the Amazon shopping list (V2 API)."""
        list_id = await self.get_shopping_list_id()
        if not list_id:
            return False

        data = await self._request(
            "POST",
            f"/lists/{list_id}/items",
            json={
                "items": [
                    {"itemType": "KEYWORD", "itemName": name}
                ],
            },
        )
        if data is not None:
            logger.info(f"Added to Amazon list: {name}")
            return True
        return False

    async def delete_item(self, item_id: str, version: int = 1) -> bool:
        """Delete an item from the Amazon shopping list (V2 API)."""
        list_id = await self.get_shopping_list_id()
        if not list_id:
            return False

        data = await self._request(
            "DELETE",
            f"/lists/{list_id}/items/{item_id}?version={version}",
            with_content_type=False,
        )
        if data is not None:
            logger.info(f"Deleted from Amazon list: item {item_id}")
            return True
        return False

    async def is_authenticated(self) -> bool:
        """Check if current cookies are valid by trying to fetch lists."""
        data = await self._request(
            "POST",
            "/lists/fetch",
            json={
                "listAttributesToAggregate": [
                    {"type": "totalActiveItemsCount"}
                ],
                "listOwnershipType": None,
            },
        )
        return data is not None
