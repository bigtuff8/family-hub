
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from shared.database import AsyncSessionLocal
from shared.models import User, UserExternalCalendar
from services.calendar.google_client import GoogleCalendarClient

logger = logging.getLogger(__name__)

async def sync_all_calendars():
    """
    Background job to sync all connected external calendars (Google, etc.)
    """
    logger.info("🔄 Starting scheduled calendar sync job...")
    
    async with AsyncSessionLocal() as db:
        try:
            # 1. Google Calendars
            # Find all users with active Google Calendar connections
            stmt = select(UserExternalCalendar).where(
                UserExternalCalendar.provider == 'google',
                UserExternalCalendar.is_active == True
            )
            result = await db.execute(stmt)
            active_connections = result.scalars().all()
            
            logger.info(f"Found {len(active_connections)} active Google Calendar connections to sync.")
            
            client = GoogleCalendarClient(db)
            
            for connection in active_connections:
                try:
                    logger.info(f"Syncing Google Calendar for user {connection.user_id} (Tenant: {connection.tenant_id})...")
                    count = await client.sync_events(connection.user_id)
                    logger.info(f"✅ Synced {count} events for user {connection.user_id}")
                except Exception as e:
                    logger.error(f"❌ Failed to sync user {connection.user_id}: {e}")
                    
        except Exception as e:
            logger.error(f"❌ Critical error in calendar sync job: {e}")
            
    logger.info("🏁 Calendar sync job completed.")
