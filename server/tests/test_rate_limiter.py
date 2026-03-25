"""
Tests for Rate Limiting Middleware
"""

import pytest
import time
from middlewares.rate_limiter import RateLimiter, RATE_LIMITS


class TestRateLimiter:
    """Test rate limiter functionality."""

    def setup_method(self):
        """Set up test fixtures."""
        self.limiter = RateLimiter()

    def test_is_allowed_under_limit(self):
        """Test that requests under limit are allowed."""
        client_id = "test_client_1"
        max_requests = 5
        window = 60

        for i in range(max_requests):
            assert self.limiter.is_allowed(client_id, max_requests, window) is True

    def test_is_allowed_over_limit(self):
        """Test that requests over limit are denied."""
        client_id = "test_client_2"
        max_requests = 3
        window = 60

        # Make max_requests
        for i in range(max_requests):
            self.limiter.is_allowed(client_id, max_requests, window)

        # Next request should be denied
        assert self.limiter.is_allowed(client_id, max_requests, window) is False

    def test_get_remaining(self):
        """Test getting remaining requests."""
        client_id = "test_client_3"
        max_requests = 5
        window = 60

        # Initially should have max_requests remaining
        remaining = self.limiter.get_remaining(client_id, max_requests, window)
        assert remaining == max_requests

        # Make 2 requests
        self.limiter.is_allowed(client_id, max_requests, window)
        self.limiter.is_allowed(client_id, max_requests, window)

        # Should have 3 remaining
        remaining = self.limiter.get_remaining(client_id, max_requests, window)
        assert remaining == 3

    def test_window_expiration(self):
        """Test that old requests expire from window."""
        client_id = "test_client_4"
        max_requests = 2
        window = 1  # 1 second window

        # Make requests
        self.limiter.is_allowed(client_id, max_requests, window)
        self.limiter.is_allowed(client_id, max_requests, window)

        # Should be at limit
        assert self.limiter.is_allowed(client_id, max_requests, window) is False

        # Wait for window to expire
        time.sleep(1.1)

        # Should be allowed again
        assert self.limiter.is_allowed(client_id, max_requests, window) is True

    def test_cleanup_old_entries(self):
        """Test cleanup of old entries."""
        client_id = "test_client_5"
        max_requests = 5
        window = 60

        # Make some requests
        for i in range(3):
            self.limiter.is_allowed(client_id, max_requests, window)

        # Cleanup should not remove recent entries
        self.limiter.cleanup()
        remaining = self.limiter.get_remaining(client_id, max_requests, window)
        assert remaining == 2  # 5 - 3 = 2

    def test_multiple_clients(self):
        """Test rate limiting for multiple clients."""
        max_requests = 3
        window = 60

        # Client 1 makes 3 requests
        for i in range(3):
            self.limiter.is_allowed("client_a", max_requests, window)

        # Client 2 should still have full allowance
        for i in range(3):
            assert self.limiter.is_allowed("client_b", max_requests, window) is True

        # Client 1 should be denied
        assert self.limiter.is_allowed("client_a", max_requests, window) is False

        # Client 2 should be denied after 3 requests
        assert self.limiter.is_allowed("client_b", max_requests, window) is False


class TestRateLimitConfig:
    """Test rate limit configuration."""

    def test_rate_limits_defined(self):
        """Test that rate limits are properly configured."""
        assert "/api/generate-course" in RATE_LIMITS
        assert "/api/generate-course-async" in RATE_LIMITS
        assert "/api/tts/synthesize" in RATE_LIMITS
        assert "default" in RATE_LIMITS

    def test_rate_limit_values(self):
        """Test rate limit values are reasonable."""
        # Generate course should be limited (5 per hour)
        gen_limit, gen_window = RATE_LIMITS["/api/generate-course"]
        assert gen_limit == 5
        assert gen_window == 3600  # 1 hour

        # Default should be more permissive
        default_limit, default_window = RATE_LIMITS["default"]
        assert default_limit == 100
        assert default_window == 60  # 1 minute
