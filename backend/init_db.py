import asyncio
from shared.database import Base, engine
from shared.models import Tenant, User, CalendarEvent, Task, RefreshToken, ShoppingList, ShoppingItem

async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        # Drop all tables (be careful in production!)
        await conn.run_sync(Base.metadata.drop_all)
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created successfully!")

if __name__ == "__main__":
    asyncio.run(init_db())