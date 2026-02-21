"""
Amazon Alexa Shopping List client using Playwright browser automation.
Location: services/alexa-sync/amazon_client.py

Since Amazon killed all shopping list APIs (July 2024), the only way to
access the native Alexa shopping list is via browser automation. This client
uses Playwright to run headless Chromium, navigates to the Alexa web app,
and uses page.evaluate() to call Amazon's internal APIs from within the
authenticated browser context.

The flow:
1. Launch headless Chromium with stored Amazon cookies
2. Navigate to alexa.amazon.co.uk to establish session
3. Use the browser's authenticated context to call shopping list APIs
4. The browser handles all CSRF, auth tokens, and cookie management
"""

import json
import logging
from pathlib import Path
from typing import Optional

from playwright.async_api import async_playwright, Browser, BrowserContext, Page

from cookie_manager import CookieManager

logger = logging.getLogger(__name__)

# Browser state file for persistence across restarts
BROWSER_STATE_FILE = "/data/browser_state.json"


class AmazonClient:
    """Browser-based client for Amazon's Alexa shopping list."""

    def __init__(self, domain: str, cookie_manager: CookieManager, password: str = ""):
        self.domain = domain
        # Derive base domain (amazon.co.uk) and alexa domain (alexa.amazon.co.uk)
        self.base_domain = domain.removeprefix("www.")
        self.alexa_domain = f"alexa.{self.base_domain}"
        self.cookie_manager = cookie_manager
        self._password = password
        self._playwright = None
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None
        self._page: Optional[Page] = None
        self._authenticated = False
        self._shopping_list_id: Optional[str] = None

    async def start(self):
        """Launch the browser and establish session."""
        logger.info("Starting Playwright browser...")
        self._playwright = await async_playwright().start()
        self._browser = await self._playwright.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-extensions",
                "--disable-background-networking",
                "--disable-default-apps",
                "--disable-sync",
                "--disable-translate",
                "--no-first-run",
            ],
        )

        # Try to restore browser state, falling back to cookies
        state_path = Path(BROWSER_STATE_FILE)
        if state_path.exists():
            try:
                self._context = await self._browser.new_context(
                    storage_state=BROWSER_STATE_FILE,
                    user_agent=(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/133.0.0.0 Safari/537.36"
                    ),
                )
                logger.info("Restored browser state from file")
            except Exception as e:
                logger.warning(f"Failed to restore browser state: {e}")
                self._context = None

        if not self._context:
            self._context = await self._browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/133.0.0.0 Safari/537.36"
                ),
            )
            # Load cookies from file
            await self._load_cookies()

        self._page = await self._context.new_page()
        logger.info("Browser started successfully")

    async def _load_cookies(self):
        """Load Amazon cookies into the browser context."""
        cookies_dict = self.cookie_manager.get_cookies()
        if not cookies_dict:
            logger.error("No cookies available to load")
            return

        # Convert simple dict to Playwright cookie format
        playwright_cookies = []
        for name, value in cookies_dict.items():
            playwright_cookies.append({
                "name": name,
                "value": str(value),
                "domain": f".{self.base_domain}",
                "path": "/",
                "secure": name in (
                    "at-acbuk", "sess-at-acbuk", "sst-acbuk",
                    "sid", "sso-state-acbuk"
                ),
                "httpOnly": name in (
                    "at-acbuk", "sess-at-acbuk", "sst-acbuk", "sid",
                ),
            })

        await self._context.add_cookies(playwright_cookies)
        logger.info(f"Loaded {len(playwright_cookies)} cookies into browser")

    async def _ensure_authenticated(self) -> bool:
        """
        Authenticate with Amazon's Alexa services.

        Flow:
        1. Navigate to alexa.amazon.co.uk to establish Alexa session
        2. Navigate to www.amazon.co.uk shopping list page (browser handles auth redirects)
        3. API calls can then be made from the www.amazon.co.uk origin
        """
        if self._authenticated:
            return True

        if not self._page:
            return False

        try:
            # Step 1: Establish Alexa session at alexa.amazon.co.uk
            logger.info("Step 1: Establishing Alexa session...")
            response = await self._page.goto(
                f"https://{self.alexa_domain}/spa/index.html",
                wait_until="domcontentloaded",
                timeout=30000,
            )

            if not response or response.status >= 400:
                logger.error(f"Failed to load Alexa SPA: status {response.status if response else 'None'}")
                return False

            await self._page.wait_for_timeout(2000)

            url = self._page.url
            if "signin" in url or "ap/signin" in url:
                logger.error("Redirected to sign-in - cookies may be expired")
                return False

            # Verify Alexa auth
            auth_check = await self._page.evaluate("""
                async () => {
                    try {
                        const r = await fetch('/api/bootstrap', {
                            credentials: 'include',
                            headers: {'Accept': 'application/json'}
                        });
                        if (r.ok) {
                            const data = await r.json();
                            return {ok: true, email: data.authentication?.customerEmail || 'unknown'};
                        }
                        return {ok: false, status: r.status};
                    } catch (e) {
                        return {ok: false, error: e.message};
                    }
                }
            """)

            if not auth_check.get("ok"):
                logger.error(f"Alexa auth check failed: {auth_check}")
                return False

            logger.info(f"Alexa session OK: {auth_check.get('email')}")

            # Step 2: Navigate to shopping list page on www.amazon.co.uk
            logger.info("Step 2: Navigating to shopping list page...")
            await self._page.goto(
                f"https://{self.domain}/alexaquantum/sp/alexaShoppingList",
                wait_until="domcontentloaded",
                timeout=60000,
            )

            await self._page.wait_for_timeout(3000)
            final_url = self._page.url
            logger.info(f"URL after navigation: {final_url}")

            # Check if we landed on sign-in page
            if "signin" in final_url or "ap/signin" in final_url:
                logger.info("Redirected to sign-in - attempting auto-login...")
                signed_in = await self._handle_signin()
                if not signed_in:
                    return False

            # Check if we need to handle 2FA/OTP
            current_url = self._page.url
            if "mfa" in current_url or "otp" in current_url or "verification" in current_url:
                logger.error("2FA/OTP required - cannot proceed automatically")
                logger.error("Please disable 2FA or add OTP handling")
                return False

            # Verify we're on the shopping list page
            current_url = self._page.url
            if "alexaquantum" in current_url or "alexashoppinglists" in current_url:
                logger.info("Successfully on shopping list page!")
                self._authenticated = True
                await self._save_state()
                return True

            # We might have landed elsewhere after sign-in
            logger.info(f"Landed on: {current_url} - testing API access...")
            self._authenticated = True
            await self._save_state()
            return True

        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return False

    async def _handle_signin(self) -> bool:
        """
        Handle Amazon sign-in page by entering password.

        Amazon's sign-in page (when redirected from shopping list) shows
        the user's name/email and asks for password re-entry. The page
        uses max_auth_age=3600 meaning a recent password entry is required.

        Selectors:
        - Password field: #ap_password
        - Submit button: #signInSubmit
        - OTP field: #auth-mfa-otpcode (if 2FA enabled)
        """
        if not self._password:
            logger.error("AMAZON_PASSWORD not configured - cannot auto-sign-in")
            logger.error("Set AMAZON_PASSWORD in your .env file on the Pi")
            return False

        try:
            # Wait for the password field to appear
            logger.info("Waiting for sign-in form...")
            await self._page.wait_for_selector("#ap_password", timeout=10000)

            # Fill in the password
            await self._page.fill("#ap_password", self._password)
            logger.info("Password entered")

            # Check if "Remember me" checkbox exists and tick it
            remember_me = await self._page.query_selector('input[name="rememberMe"]')
            if remember_me:
                await remember_me.check()
                logger.info("Checked 'Remember me'")

            # Click sign-in button
            await self._page.click("#signInSubmit")
            logger.info("Clicked sign-in button, waiting for navigation...")

            # Wait for navigation after sign-in
            await self._page.wait_for_load_state("domcontentloaded", timeout=30000)
            await self._page.wait_for_timeout(3000)

            current_url = self._page.url

            # Check for 2FA/OTP challenge
            if "mfa" in current_url or "otp" in current_url or "verification" in current_url:
                logger.error("2FA/MFA challenge detected - cannot proceed automatically")
                logger.error("Consider disabling 2FA on your Amazon account, or use app-based auth")
                return False

            # Check for CAPTCHA
            captcha = await self._page.query_selector("#auth-captcha-image")
            if captcha:
                logger.error("CAPTCHA challenge detected - cannot proceed automatically")
                return False

            # Check for wrong password
            error_box = await self._page.query_selector("#auth-error-message-box")
            if error_box:
                error_text = await error_box.inner_text()
                logger.error(f"Sign-in error: {error_text}")
                return False

            # Check if we're still on sign-in page
            if "signin" in current_url or "ap/signin" in current_url:
                # Could be another challenge page
                page_title = await self._page.title()
                logger.error(f"Still on sign-in page after submit. Title: {page_title}, URL: {current_url}")
                return False

            logger.info(f"Sign-in successful! Now at: {current_url}")

            # If we didn't land on the shopping list page, navigate there
            if "alexaquantum" not in current_url and "alexashoppinglists" not in current_url:
                logger.info("Navigating to shopping list page after sign-in...")
                await self._page.goto(
                    f"https://{self.domain}/alexaquantum/sp/alexaShoppingList",
                    wait_until="domcontentloaded",
                    timeout=30000,
                )
                await self._page.wait_for_timeout(2000)

            return True

        except Exception as e:
            logger.error(f"Sign-in failed: {e}")
            # Take a screenshot for debugging
            try:
                await self._page.screenshot(path="/data/signin-error.png")
                logger.info("Saved error screenshot to /data/signin-error.png")
            except Exception:
                pass
            return False

    async def _save_state(self):
        """Save browser state (cookies + storage) for persistence."""
        try:
            if self._context:
                await self._context.storage_state(path=BROWSER_STATE_FILE)
                logger.debug("Saved browser state")
        except Exception as e:
            logger.warning(f"Failed to save browser state: {e}")

    async def _call_shopping_api(self, js_code: str) -> Optional[dict]:
        """Execute a fetch() call from within the authenticated browser context."""
        if not await self._ensure_authenticated():
            return None

        try:
            result = await self._page.evaluate(js_code)
            return result
        except Exception as e:
            logger.error(f"Shopping API call failed: {e}")
            # Reset auth state - might need to re-authenticate
            self._authenticated = False
            return None

    async def get_shopping_list_id(self) -> Optional[str]:
        """Find the Alexa shopping list ID."""
        if self._shopping_list_id:
            return self._shopping_list_id

        # Navigate to the shopping list page within the SPA
        # This triggers the SPA to load list data
        result = await self._call_shopping_api("""
            async () => {
                try {
                    // Try the V2 API from within the browser context
                    // The browser's cookies and CSRF are automatically included
                    const r = await fetch('/alexashoppinglists/api/v2/lists/fetch', {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify({
                            listAttributesToAggregate: [{type: 'totalActiveItemsCount'}],
                            listOwnershipType: null
                        })
                    });
                    if (r.ok) return {ok: true, data: await r.json()};
                    return {ok: false, status: r.status, text: await r.text()};
                } catch (e) {
                    return {ok: false, error: e.message};
                }
            }
        """)

        if not result or not result.get("ok"):
            # Fallback: try to navigate to the shopping list page and extract from DOM
            logger.warning(f"V2 API failed from browser: {result}")
            return await self._get_list_id_from_page()

        data = result.get("data", {})
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

        logger.error(f"No shopping lists found in response")
        return None

    async def _get_list_id_from_page(self) -> Optional[str]:
        """Fallback: navigate to shopping list page and extract list ID from the DOM/URL."""
        try:
            logger.info("Trying page navigation fallback for list ID...")
            await self._page.goto(
                f"https://{self.alexa_domain}/spa/index.html#/shopping/lists",
                wait_until="domcontentloaded",
                timeout=30000,
            )
            await self._page.wait_for_timeout(3000)

            # Try to extract list ID from the page
            list_id = await self._page.evaluate("""
                () => {
                    // Look for list ID in the URL hash
                    const hash = window.location.hash;
                    const match = hash.match(/lists\\/([a-zA-Z0-9-]+)/);
                    if (match) return match[1];

                    // Look for data attributes
                    const listEl = document.querySelector('[data-list-id]');
                    if (listEl) return listEl.getAttribute('data-list-id');

                    return null;
                }
            """)

            if list_id:
                self._shopping_list_id = list_id
                logger.info(f"Got list ID from page: {list_id}")

            return list_id
        except Exception as e:
            logger.error(f"Page fallback failed: {e}")
            return None

    async def get_items(self) -> Optional[list[dict]]:
        """Get all items from the Alexa shopping list."""
        list_id = await self.get_shopping_list_id()
        if not list_id:
            return None

        result = await self._call_shopping_api(f"""
            async () => {{
                try {{
                    const r = await fetch(
                        '/alexashoppinglists/api/v2/lists/{list_id}/items/fetch',
                        {{
                            method: 'POST',
                            credentials: 'include',
                            headers: {{
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                            }},
                            body: JSON.stringify({{
                                maxResults: 100,
                                itemAttributesToProject: ['quantity', 'note']
                            }})
                        }}
                    );
                    if (r.ok) return {{ok: true, data: await r.json()}};
                    return {{ok: false, status: r.status, text: await r.text()}};
                }} catch (e) {{
                    return {{ok: false, error: e.message}};
                }}
            }}
        """)

        if not result or not result.get("ok"):
            logger.warning(f"Failed to fetch items: {result}")
            return await self._get_items_from_page()

        data = result.get("data", {})
        items = data.get("itemInfoList", [])

        # Normalize to our standard format
        normalized = []
        for item in items:
            normalized.append({
                "itemId": item.get("itemId", ""),
                "value": item.get("itemName", ""),
                "completed": item.get("itemStatus", "ACTIVE") == "COMPLETE",
                "version": item.get("version", 1),
            })

        return normalized

    async def _get_items_from_page(self) -> Optional[list[dict]]:
        """Fallback: scrape items from the rendered shopping list page."""
        try:
            logger.info("Trying DOM scraping fallback for items...")
            await self._page.goto(
                f"https://{self.alexa_domain}/spa/index.html#/shopping/lists",
                wait_until="domcontentloaded",
                timeout=30000,
            )
            # Wait for the list to render
            await self._page.wait_for_timeout(5000)

            items = await self._page.evaluate("""
                () => {
                    const items = [];
                    // Try common selectors for shopping list items
                    const selectors = [
                        '.virtual-list .item-title',
                        '[data-testid="shopping-list-item"]',
                        '.shopping-item',
                        '.list-item-text',
                    ];
                    for (const sel of selectors) {
                        const els = document.querySelectorAll(sel);
                        if (els.length > 0) {
                            els.forEach((el, i) => {
                                items.push({
                                    itemId: el.getAttribute('data-item-id') || `dom-${i}`,
                                    value: el.textContent.trim(),
                                    completed: false,
                                    version: 1,
                                });
                            });
                            break;
                        }
                    }
                    return items;
                }
            """)

            if items:
                logger.info(f"Scraped {len(items)} items from DOM")
            else:
                logger.warning("No items found via DOM scraping")

            return items if items else None
        except Exception as e:
            logger.error(f"DOM scraping failed: {e}")
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

        result = await self._call_shopping_api(f"""
            async () => {{
                try {{
                    const r = await fetch(
                        '/alexashoppinglists/api/v2/lists/{list_id}/items',
                        {{
                            method: 'POST',
                            credentials: 'include',
                            headers: {{
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                            }},
                            body: JSON.stringify({{
                                items: [{{itemType: 'KEYWORD', itemName: '{name.replace(chr(39), chr(92) + chr(39))}'}}]
                            }})
                        }}
                    );
                    if (r.ok) return {{ok: true}};
                    return {{ok: false, status: r.status}};
                }} catch (e) {{
                    return {{ok: false, error: e.message}};
                }}
            }}
        """)

        if result and result.get("ok"):
            logger.info(f"Added to Amazon list: {name}")
            return True

        logger.warning(f"Failed to add item '{name}': {result}")
        return False

    async def delete_item(self, item_id: str, version: int = 1) -> bool:
        """Delete an item from the Amazon shopping list."""
        list_id = await self.get_shopping_list_id()
        if not list_id:
            return False

        result = await self._call_shopping_api(f"""
            async () => {{
                try {{
                    const r = await fetch(
                        '/alexashoppinglists/api/v2/lists/{list_id}/items/{item_id}?version={version}',
                        {{
                            method: 'DELETE',
                            credentials: 'include',
                            headers: {{'Accept': 'application/json'}},
                        }}
                    );
                    return {{ok: r.ok, status: r.status}};
                }} catch (e) {{
                    return {{ok: false, error: e.message}};
                }}
            }}
        """)

        if result and result.get("ok"):
            logger.info(f"Deleted from Amazon list: item {item_id}")
            return True

        logger.warning(f"Failed to delete item {item_id}: {result}")
        return False

    async def is_authenticated(self) -> bool:
        """Check if current browser session is valid."""
        return await self._ensure_authenticated()

    async def stop(self):
        """Shut down the browser."""
        try:
            if self._context:
                await self._save_state()
            if self._page:
                await self._page.close()
            if self._context:
                await self._context.close()
            if self._browser:
                await self._browser.close()
            if self._playwright:
                await self._playwright.stop()
            logger.info("Browser shut down")
        except Exception as e:
            logger.warning(f"Error during browser shutdown: {e}")
