"""
Tests for Database Connection with Reconnection Logic
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock


class TestDatabaseConfiguration:
    """Test database configuration values."""

    def test_reconnect_attempts_reasonable(self):
        """Test that reconnect attempts value is reasonable."""
        from config.database import MAX_RECONNECT_ATTEMPTS
        
        assert 1 <= MAX_RECONNECT_ATTEMPTS <= 10
        assert MAX_RECONNECT_ATTEMPTS == 5

    def test_reconnect_delay_reasonable(self):
        """Test that reconnect delay is reasonable."""
        from config.database import RECONNECT_DELAY
        
        assert 1 <= RECONNECT_DELAY <= 30
        assert RECONNECT_DELAY == 5  # 5 seconds

    def test_connection_timeout_reasonable(self):
        """Test that connection timeout is reasonable."""
        from config.database import CONNECTION_TIMEOUT
        
        assert 10000 <= CONNECTION_TIMEOUT <= 60000
        assert CONNECTION_TIMEOUT == 30000  # 30 seconds

    def test_database_constants_exist(self):
        """Test that database constants are defined."""
        from config.database import MONGO_URI, DATABASE_NAME
        
        assert isinstance(MONGO_URI, str)
        assert isinstance(DATABASE_NAME, str)
        assert DATABASE_NAME == "text-to-learn"


class TestDatabaseFunctions:
    """Test database function existence and basic behavior."""

    @pytest.mark.asyncio
    async def test_connect_to_database_exists(self):
        """Test connect function exists and is callable."""
        from config.database import connect_to_database
        
        assert callable(connect_to_database)

    @pytest.mark.asyncio
    async def test_close_database_connection_exists(self):
        """Test close function exists and is callable."""
        from config.database import close_database_connection
        
        assert callable(close_database_connection)

    @pytest.mark.asyncio
    async def test_get_db_connection_exists(self):
        """Test get connection function exists."""
        from config.database import get_db_connection
        
        assert callable(get_db_connection)

    def test_is_db_connected_exists(self):
        """Test is_connected function exists."""
        from config.database import is_db_connected
        
        assert callable(is_db_connected)

    @pytest.mark.asyncio
    async def test_connect_failure_returns_false(self):
        """Test that connection failure returns False."""
        from config.database import connect_to_database
        
        with patch('config.database.AsyncIOMotorClient') as mock_client:
            mock_client.side_effect = Exception("Connection failed")
            
            result = await connect_to_database(retry=False)
            
            assert result is False

    @pytest.mark.asyncio
    async def test_close_connection_handles_error(self):
        """Test that close connection handles errors gracefully."""
        from config.database import close_database_connection
        
        # Should not raise even if not connected
        await close_database_connection()
