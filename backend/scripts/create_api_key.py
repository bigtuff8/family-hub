"""
One-off script to create an API key for the Alexa sync service.
Run inside the backend container:
  docker exec familyhub-backend python scripts/create_api_key.py
"""

import asyncio
import secrets
import sys
import os

# Add parent dir to path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from passlib.hash import bcrypt
from sqlalchemy import select, text
from shared.database import async_engine, AsyncSessionLocal
from shared.models import ApiKey, Base


async def main():
    # Get the first tenant
    async with AsyncSessionLocal() as db:
        result = await db.execute(text("SELECT id FROM tenants LIMIT 1"))
        row = result.first()
        if not row:
            print("ERROR: No tenants found in database")
            return

        tenant_id = row[0]
        print(f"Using tenant: {tenant_id}")

        # Generate key
        raw_key = f"fh_ak_{secrets.token_hex(32)}"
        key_hash = bcrypt.hash(raw_key)
        key_prefix = raw_key[:12]

        # Create API key record
        api_key = ApiKey(
            tenant_id=tenant_id,
            name="alexa-sync",
            key_hash=key_hash,
            key_prefix=key_prefix,
            scopes=["shopping"],
            is_active=True,
        )
        db.add(api_key)
        await db.commit()

        print(f"\n{'='*60}")
        print(f"API Key created successfully!")
        print(f"Name: alexa-sync")
        print(f"Scopes: ['shopping']")
        print(f"")
        print(f"KEY (save this - shown only once):")
        print(f"  {raw_key}")
        print(f"{'='*60}")


if __name__ == "__main__":
    asyncio.run(main())
