"""
Auth0 Authentication Middleware for FastAPI
Validates JWT tokens from Auth0 and extracts user information.
"""
import os
import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

# Auth0 configuration
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", "")
AUTH0_ISSUER = f"https://{AUTH0_DOMAIN}/" if AUTH0_DOMAIN else ""

# Security scheme
security = HTTPBearer(auto_error=False)


class Auth0JWTBearer:
    """
    Auth0 JWT Bearer Token Validator
    
    Usage:
        @app.get("/protected")
        async def protected_route(user: dict = Depends(Auth0JWTBearer())):
            return {"user": user}
    """
    
    def __init__(self):
        self.jwks_url = f"{AUTH0_ISSUER}.well-known/jwks.json" if AUTH0_DOMAIN else None
        self.jwks_client = PyJWKClient(self.jwks_url) if AUTH0_DOMAIN else None
    
    async def __call__(self, credentials: HTTPAuthorizationCredentials = Security(security)):
        if not AUTH0_DOMAIN or AUTH0_DOMAIN == "your-auth0-domain.auth0.com":
            # Auth0 not configured - return mock user for development
            return {
                "sub": "dev|user123",
                "email": "dev@example.com",
                "name": "Developer",
                "email_verified": True
            }
        
        if credentials is None:
            raise HTTPException(
                status_code=401,
                detail="Authorization header missing",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        token = credentials.credentials
        
        try:
            # Get the signing key from JWKS
            signing_key = self.jwks_client.get_signing_key_from_jwt(token).key
            
            # Decode and verify the token
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=["RS256"],
                audience=AUTH0_AUDIENCE,
                issuer=AUTH0_ISSUER,
            )
            
            # Extract user information
            user_info = {
                "sub": payload.get("sub"),  # Auth0 user ID
                "email": payload.get("email"),
                "name": payload.get("name"),
                "picture": payload.get("picture"),
                "email_verified": payload.get("email_verified", False),
            }
            
            return user_info
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=401,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=401,
                detail=f"Invalid token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Authentication error: {str(e)}",
            )


# Dependency for optional authentication
async def get_optional_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Get user from token if present, otherwise return None.
    Use this for routes that work for both authenticated and anonymous users.
    """
    if not AUTH0_DOMAIN or credentials is None:
        return None
    
    token = credentials.credentials
    
    try:
        signing_key = Auth0JWTBearer().jwks_client.get_signing_key_from_jwt(token).key
        
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=AUTH0_AUDIENCE,
            issuer=AUTH0_ISSUER,
        )
        
        return {
            "sub": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name"),
            "picture": payload.get("picture"),
        }
        
    except Exception:
        # Token is invalid, but we don't raise error for optional auth
        return None


# Create instance for dependency injection
Auth0JWTBearer = Auth0JWTBearer()
