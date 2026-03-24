"""
Database configuration for MongoDB connection using Motor
"""

import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/text-to-learn")
DATABASE_NAME = "text-to-learn"

client = None
db = None


async def connect_to_database():
    """Initialize MongoDB connection and Beanie ODM"""
    global client, db

    try:
        # Use certifi for SSL certificates
        client = AsyncIOMotorClient(
            MONGO_URI,
            tlsCAFile=certifi.where(),
            tls=True,
            tlsAllowInvalidCertificates=False,
            serverSelectionTimeoutMS=10000,
            socketTimeoutMS=45000,
            connectTimeoutMS=45000,
        )
        db = client[DATABASE_NAME]

        # Test connection
        await client.admin.command("ping")

        # Initialize Beanie with all document models
        from models.user import User
        from models.course import Course

        await init_beanie(database=db, document_models=[User, Course])

        print("✓ MongoDB connection established")
        print(f"✓ Database: {DATABASE_NAME}")
        return True

    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")
        return False


async def close_database_connection():
    """Close MongoDB connection"""
    global client

    if client:
        client.close()
        print("✓ MongoDB connection closed")


def get_database():
    """Get database instance"""
    return db
