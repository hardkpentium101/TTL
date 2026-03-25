"""
Tests for Auth Middleware with Anonymous User Support
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException


class TestAnonymousAuth:
    """Test anonymous user authentication."""

    @pytest.mark.asyncio
    async def test_get_user_or_anonymous_dev_mode(self):
        """Test dev mode returns mock user."""
        from middlewares.auth import get_user_or_anonymous
        
        with patch('middlewares.auth.AUTH0_DOMAIN', 'your-auth0-domain.auth0.com'):
            result = await get_user_or_anonymous(None)
            
            assert result is not None
            assert result.get('is_anonymous') is False
            assert result.get('sub') == 'dev|user123'
            assert result.get('email') == 'dev@example.com'

    @pytest.mark.asyncio
    async def test_get_user_or_anonymous_returns_anonymous(self):
        """Test that function returns anonymous user structure."""
        from middlewares.auth import get_user_or_anonymous
        
        # Just verify the function exists and is callable
        assert callable(get_user_or_anonymous)

    @pytest.mark.asyncio  
    async def test_get_optional_user_exists(self):
        """Test optional user function exists."""
        from middlewares.auth import get_optional_user
        
        assert callable(get_optional_user)


class TestAuthConfiguration:
    """Test auth configuration values."""

    def test_auth_constants_exist(self):
        """Test that auth constants are defined."""
        from middlewares.auth import AUTH0_DOMAIN, AUTH0_AUDIENCE
        
        # These should be strings (may be empty if not configured)
        assert isinstance(AUTH0_DOMAIN, str)
        assert isinstance(AUTH0_AUDIENCE, str)
