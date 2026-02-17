"""
Family Hub API client for the Alexa skill Lambda.
Location: services/alexa-skill/familyhub_client.py

Uses synchronous httpx (Lambda doesn't need async for simple request/response).
"""

import os
import logging

import httpx

logger = logging.getLogger(__name__)

FAMILYHUB_API_URL = os.environ.get("FAMILYHUB_API_URL", "")
FAMILYHUB_API_KEY = os.environ.get("FAMILYHUB_API_KEY", "")
TIMEOUT = 10.0


def _headers():
    return {"X-API-Key": FAMILYHUB_API_KEY}


def add_item(name: str, quantity: int = 1) -> dict | None:
    """Add an item to the shopping list."""
    try:
        resp = httpx.post(
            f"{FAMILYHUB_API_URL}/api/v1/shopping/service/items",
            headers=_headers(),
            json={"items": [{"name": name, "quantity": quantity, "source": "alexa"}]},
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Failed to add item: {e}")
        return None


def remove_item(name: str) -> dict | None:
    """Remove an item from the shopping list by name."""
    try:
        resp = httpx.post(
            f"{FAMILYHUB_API_URL}/api/v1/shopping/service/items/delete-by-name",
            headers=_headers(),
            json={"names": [name]},
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Failed to remove item: {e}")
        return None


def get_items() -> list[dict] | None:
    """Get all unchecked items from the shopping list."""
    try:
        resp = httpx.get(
            f"{FAMILYHUB_API_URL}/api/v1/shopping/service/items",
            headers=_headers(),
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Failed to get items: {e}")
        return None
