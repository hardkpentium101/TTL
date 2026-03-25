"""
Rate Limiting Middleware for FastAPI
Implements simple in-memory rate limiting to prevent API abuse.
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from datetime import datetime, timedelta
import time


class RateLimiter:
    """
    Simple in-memory rate limiter using sliding window algorithm.
    
    For production, consider using Redis-based rate limiting.
    """
    
    def __init__(self):
        # Store request timestamps per client
        self.requests = defaultdict(list)
        # Clean up old entries every 5 minutes
        self.cleanup_interval = 300
    
    def is_allowed(self, client_id: str, max_requests: int, window_seconds: int) -> bool:
        """
        Check if a request is allowed for the given client.
        
        Args:
            client_id: Unique identifier for the client (IP or user ID)
            max_requests: Maximum number of requests allowed in the window
            window_seconds: Time window in seconds
            
        Returns:
            True if request is allowed, False otherwise
        """
        now = time.time()
        window_start = now - window_seconds
        
        # Remove old requests outside the window
        self.requests[client_id] = [
            timestamp for timestamp in self.requests[client_id]
            if timestamp > window_start
        ]
        
        # Check if under limit
        if len(self.requests[client_id]) < max_requests:
            self.requests[client_id].append(now)
            return True
        
        return False
    
    def get_remaining(self, client_id: str, max_requests: int, window_seconds: int) -> int:
        """Get remaining requests for a client."""
        now = time.time()
        window_start = now - window_seconds
        
        current_requests = len([
            timestamp for timestamp in self.requests[client_id]
            if timestamp > window_start
        ])
        
        return max(0, max_requests - current_requests)
    
    def cleanup(self):
        """Remove old entries to prevent memory leaks."""
        now = time.time()
        # Remove entries older than 1 hour
        cutoff = now - 3600
        
        for client_id in list(self.requests.keys()):
            self.requests[client_id] = [
                timestamp for timestamp in self.requests[client_id]
                if timestamp > cutoff
            ]
            # Remove empty entries
            if not self.requests[client_id]:
                del self.requests[client_id]


# Global rate limiter instance
rate_limiter = RateLimiter()


# Rate limit configurations for different endpoints
RATE_LIMITS = {
    # Endpoint pattern: (max_requests, window_seconds)
    "/api/generate-course": (5, 3600),      # 5 requests per hour
    "/api/generate-course-async": (5, 3600), # 5 requests per hour
    "/api/tts/synthesize": (20, 3600),       # 20 requests per hour
    "/api/youtube/search": (30, 3600),       # 30 requests per hour
    "default": (100, 60),                     # 100 requests per minute (default)
}


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware to apply rate limiting to API requests.
    """
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for non-API routes
        if not request.url.path.startswith("/api"):
            return await call_next(request)
        
        # Get client identifier (use user ID if authenticated, otherwise IP)
        client_id = self._get_client_id(request)
        
        # Find matching rate limit for this endpoint
        limit_config = self._get_rate_limit_for_path(request.url.path)
        max_requests, window_seconds = limit_config
        
        # Check rate limit
        if not rate_limiter.is_allowed(client_id, max_requests, window_seconds):
            # Calculate retry-after time
            retry_after = window_seconds
            
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "detail": f"Too many requests. Please try again in {retry_after} seconds.",
                    "retry_after": retry_after,
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(max_requests),
                    "X-RateLimit-Remaining": "0",
                }
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers to response
        remaining = rate_limiter.get_remaining(client_id, max_requests, window_seconds)
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Window"] = str(window_seconds)
        
        return response
    
    def _get_client_id(self, request: Request) -> str:
        """Extract client identifier from request."""
        # Try to get user ID from auth header (if authenticated)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            # Use token hash as client ID for authenticated users
            import hashlib
            token = auth_header[7:]  # Remove "Bearer " prefix
            return f"user:{hashlib.sha256(token.encode()).hexdigest()[:16]}"
        
        # Fall back to IP address
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"
        
        return f"ip:{ip}"
    
    def _get_rate_limit_for_path(self, path: str) -> tuple:
        """Get rate limit configuration for a specific path."""
        # Check for exact match
        if path in RATE_LIMITS:
            return RATE_LIMITS[path]
        
        # Check for prefix match
        for endpoint, limit in RATE_LIMITS.items():
            if endpoint != "default" and path.startswith(endpoint):
                return limit
        
        # Return default limit
        return RATE_LIMITS["default"]


# Periodic cleanup task
async def cleanup_rate_limiter():
    """Run periodic cleanup of old rate limit entries."""
    while True:
        await asyncio.sleep(300)  # Clean up every 5 minutes
        rate_limiter.cleanup()


import asyncio
