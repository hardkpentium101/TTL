"""
Database configuration for MongoDB connection using Motor
Handles connection, reconnection, and graceful degradation.
"""

import os
import certifi
import asyncio
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/text-to-learn")
DATABASE_NAME = "text-to-learn"

# Reconnection settings
MAX_RECONNECT_ATTEMPTS = 5
RECONNECT_DELAY = 5  # seconds
CONNECTION_TIMEOUT = 30000  # milliseconds

client = None
db = None
is_connected = False


async def connect_to_database(retry: bool = True) -> bool:
    """
    Initialize MongoDB connection and Beanie ODM.
    Implements automatic reconnection logic.
    
    Args:
        retry: If True, will attempt to reconnect on failure
        
    Returns:
        True if connected, False otherwise
    """
    global client, db, is_connected

    attempt = 0
    while attempt < (MAX_RECONNECT_ATTEMPTS if retry else 1):
        try:
            attempt += 1
            
            # Use certifi for SSL certificates
            client = AsyncIOMotorClient(
                MONGO_URI,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=CONNECTION_TIMEOUT,
                socketTimeoutMS=60000,
                connectTimeoutMS=CONNECTION_TIMEOUT,
                retryWrites=True,
                retryReads=True,
                maxPoolSize=50,
                minPoolSize=10,
            )
            db = client[DATABASE_NAME]

            # Test connection with timeout
            await asyncio.wait_for(
                client.admin.command("ping"),
                timeout=10.0
            )

            # Initialize Beanie with all document models
            from models.user import User
            from models.course import Course

            await init_beanie(database=db, document_models=[User, Course])

            is_connected = True
            logger.info("✓ MongoDB connection established")
            logger.info(f"✓ Database: {DATABASE_NAME}")
            return True

        except asyncio.TimeoutError:
            logger.warning(f"MongoDB connection timeout (attempt {attempt}/{MAX_RECONNECT_ATTEMPTS})")
        except Exception as e:
            logger.warning(f"MongoDB connection failed (attempt {attempt}/{MAX_RECONNECT_ATTEMPTS}): {e}")
        
        if attempt < MAX_RECONNECT_ATTEMPTS:
            logger.info(f"Retrying MongoDB connection in {RECONNECT_DELAY} seconds...")
            await asyncio.sleep(RECONNECT_DELAY)
    
    logger.error("✗ MongoDB connection failed after all attempts - running in mock mode")
    is_connected = False
    return False


async def close_database_connection():
    """Close MongoDB connection gracefully."""
    global client, is_connected

    if client:
        try:
            client.close()
            logger.info("✓ MongoDB connection closed")
        except Exception as e:
            logger.error(f"Error closing MongoDB connection: {e}")
        finally:
            client = None
            is_connected = False


async def get_db_connection():
    """
    Get database instance with automatic reconnection.
    Returns None if not connected (mock mode).
    """
    global is_connected
    
    if not is_connected:
        # Try to reconnect
        await connect_to_database(retry=False)
    
    return db


def get_database():
    """Get database instance (synchronous version)."""
    return db


def is_db_connected() -> bool:
    """Check if database is connected."""
    return is_connected
