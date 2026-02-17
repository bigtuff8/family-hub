"""
Bidirectional sync engine between Amazon Alexa shopping list and Family Hub.
Location: services/alexa-sync/sync_engine.py
"""

import logging
from typing import Optional

from amazon_client import AmazonClient
from familyhub_client import FamilyHubClient

logger = logging.getLogger(__name__)


class SyncEngine:
    """Handles bidirectional sync between Amazon and Family Hub shopping lists."""

    def __init__(
        self,
        amazon: AmazonClient,
        familyhub: FamilyHubClient,
        sync_direction: str = "bidirectional"
    ):
        self.amazon = amazon
        self.familyhub = familyhub
        self.sync_direction = sync_direction

    async def sync(self) -> dict:
        """
        Run a full sync cycle.

        Returns:
            {"status": "success"|"failed", "imported": int, "exported": int, "error": str|None}
        """
        imported = 0
        exported = 0

        try:
            # 1. Read both lists
            amazon_items = await self.amazon.get_active_items()
            if amazon_items is None:
                return {
                    "status": "cookie_expired",
                    "imported": 0,
                    "exported": 0,
                    "error": "Failed to read Amazon list - cookies may be expired"
                }

            fh_items = await self.familyhub.get_items()
            if fh_items is None:
                return {
                    "status": "failed",
                    "imported": 0,
                    "exported": 0,
                    "error": "Failed to read Family Hub list"
                }

            # Build normalized lookup sets
            amazon_names = {item["value"].lower().strip(): item for item in amazon_items}
            fh_names = {item["name"].lower().strip(): item for item in fh_items}

            # 2. Import: Items on Amazon but not in Family Hub
            if self.sync_direction in ("bidirectional", "import_only"):
                imported = await self._import_from_amazon(amazon_names, fh_names)

            # 3. Export: Items in Family Hub but not on Amazon
            if self.sync_direction in ("bidirectional", "export_only"):
                exported = await self._export_to_amazon(amazon_names, fh_names, fh_items)

            # 4. Sync-back: Items checked in FH that exist on Amazon → remove from Amazon
            if self.sync_direction in ("bidirectional", "import_only"):
                await self._sync_checked_items(amazon_names)

            return {
                "status": "success",
                "imported": imported,
                "exported": exported,
                "error": None,
            }

        except Exception as e:
            logger.exception("Sync failed with unexpected error")
            return {
                "status": "failed",
                "imported": imported,
                "exported": exported,
                "error": str(e),
            }

    async def _import_from_amazon(
        self,
        amazon_names: dict,
        fh_names: dict
    ) -> int:
        """Import items from Amazon that don't exist in Family Hub."""
        new_items = []
        for name_normalized, amazon_item in amazon_names.items():
            if name_normalized not in fh_names:
                new_items.append({
                    "name": amazon_item["value"],
                    "quantity": 1,
                    "source": "alexa",
                })

        if not new_items:
            logger.debug("No new items to import from Amazon")
            return 0

        result = await self.familyhub.add_items(new_items)
        if result:
            count = result.get("added", 0) + result.get("merged", 0)
            logger.info(f"Imported {count} items from Amazon (added={result.get('added', 0)}, merged={result.get('merged', 0)})")
            return count

        return 0

    async def _export_to_amazon(
        self,
        amazon_names: dict,
        fh_names: dict,
        fh_items: list[dict]
    ) -> int:
        """Export items from Family Hub to Amazon that don't exist there."""
        exported = 0
        for item in fh_items:
            name_normalized = item["name"].lower().strip()
            # Only export items that are manually added (not already from Alexa)
            if name_normalized not in amazon_names and item.get("source") != "alexa":
                success = await self.amazon.add_item(item["name"])
                if success:
                    exported += 1

        if exported > 0:
            logger.info(f"Exported {exported} items to Amazon")

        return exported

    async def _sync_checked_items(self, amazon_names: dict):
        """
        Remove items from Amazon that have been checked off in Family Hub.
        Checks the full FH list (including checked items) and removes matching
        Amazon items that are checked in FH.
        """
        fh_all_items = await self.familyhub.get_all_items()
        if not fh_all_items:
            return

        checked_names = {
            item["name"].lower().strip()
            for item in fh_all_items
            if item.get("checked", False)
        }

        for name_normalized, amazon_item in amazon_names.items():
            if name_normalized in checked_names:
                await self.amazon.delete_item(amazon_item["itemId"])
                logger.info(f"Removed checked item from Amazon: {amazon_item['value']}")
