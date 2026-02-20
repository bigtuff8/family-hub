"""
Alexa Shopping List Sync Service - Entry Point.
Location: services/alexa-sync/main.py

Periodically syncs the Amazon Alexa shopping list with Family Hub.
Runs as a standalone Docker container alongside the Family Hub services.
Uses Playwright headless Chromium for Amazon authentication.
"""

import asyncio
import logging
import sys

from apscheduler.schedulers.asyncio import AsyncIOScheduler

import config
from amazon_client import AmazonClient
from cookie_manager import CookieManager
from familyhub_client import FamilyHubClient
from sync_engine import SyncEngine

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("alexa-sync")


# Initialize clients
cookie_manager = CookieManager(config.AMAZON_COOKIES_FILE)
amazon_client = AmazonClient(config.AMAZON_DOMAIN, cookie_manager)
fh_client = FamilyHubClient(config.FAMILYHUB_API_URL, config.FAMILYHUB_API_KEY)
sync_engine = SyncEngine(amazon_client, fh_client, config.SYNC_DIRECTION)


async def run_sync():
    """Execute a single sync cycle."""
    logger.info("Starting sync cycle...")

    # Check if API key is configured
    if not config.FAMILYHUB_API_KEY:
        logger.error("FAMILYHUB_API_KEY not set - cannot sync")
        return

    # Check cookie status
    cookie_status = cookie_manager.status
    if cookie_status == "not_configured":
        logger.warning("Amazon cookies not configured - skipping sync")
        await fh_client.update_sync_status(
            status="failed",
            error="Amazon cookies not configured",
            cookie_status="not_configured",
        )
        return

    # Run sync
    result = await sync_engine.sync()

    # Update status in Family Hub
    await fh_client.update_sync_status(
        status=result["status"],
        error=result.get("error"),
        items_imported=result.get("imported", 0),
        items_exported=result.get("exported", 0),
        cookie_status="expired" if result["status"] == "cookie_expired" else "valid",
    )

    if result["status"] == "success":
        logger.info(
            f"Sync complete: imported={result['imported']}, exported={result['exported']}"
        )
    else:
        logger.error(f"Sync failed: {result.get('error', 'unknown error')}")


async def main():
    """Main entry point."""
    logger.info("=" * 60)
    logger.info("Alexa Shopping List Sync Service starting")
    logger.info(f"  Family Hub API: {config.FAMILYHUB_API_URL}")
    logger.info(f"  Amazon domain: {config.AMAZON_DOMAIN}")
    logger.info(f"  Poll interval: {config.POLL_INTERVAL_MINUTES} minutes")
    logger.info(f"  Sync direction: {config.SYNC_DIRECTION}")
    logger.info(f"  Cookie file: {config.AMAZON_COOKIES_FILE}")
    logger.info(f"  Cookie status: {cookie_manager.status}")
    logger.info("=" * 60)

    # Start the browser
    try:
        await amazon_client.start()
    except Exception as e:
        logger.error(f"Failed to start browser: {e}")
        logger.error("The sync service requires Playwright Chromium to run")
        return

    # Run initial sync
    await run_sync()

    # Schedule periodic sync
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        run_sync,
        "interval",
        minutes=config.POLL_INTERVAL_MINUTES,
        id="alexa_sync",
        name="Alexa Shopping List Sync",
    )
    scheduler.start()
    logger.info(f"Scheduler started: syncing every {config.POLL_INTERVAL_MINUTES} minutes")

    # Keep running
    try:
        while True:
            await asyncio.sleep(3600)
    except (KeyboardInterrupt, SystemExit):
        logger.info("Shutting down...")
        scheduler.shutdown()
        await amazon_client.stop()


if __name__ == "__main__":
    asyncio.run(main())
