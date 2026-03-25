"""
Auth0 Authentication Middleware for FastAPI
Validates JWT tokens from Auth0 and extracts user information.
"""

import os
import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

# Auth0 configuration
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", "")
AUTH0_CLIENT_ID = os.getenv("AUTH0_CLIENT_ID", "")
AUTH0_ISSUER = f"https://{AUTH0_DOMAIN}/" if AUTH0_DOMAIN else ""

# Support both API audience and client ID (for id_token)
VALID_AUDIENCES = [AUTH0_AUDIENCE]
if AUTH0_CLIENT_ID:
    VALID_AUDIENCES.append(AUTH0_CLIENT_ID)

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

    async def __call__(
        self, credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        if not AUTH0_DOMAIN or AUTH0_DOMAIN == "your-auth0-domain.auth0.com":
            # Auth0 not configured - return mock user for development
            return {
                "sub": "dev|user123",
                "email": "dev@example.com",
                "name": "Developer",
                "email_verified": True,
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

            # Try decoding with valid audiences
            payload = None
            for audience in VALID_AUDIENCES:
                if not audience:
                    continue
                try:
                    payload = jwt.decode(
                        token,
                        signing_key,
                        algorithms=["RS256"],
                        audience=audience,
                        issuer=AUTH0_ISSUER,
                    )
                    break
                except jwt.InvalidAudienceError:
                    continue

            if payload is None:
                raise jwt.InvalidTokenError("Invalid audience")

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
async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """
    Get user from token if present, otherwise return None.
    Use this for routes that work for both authenticated and anonymous users.
    """
    if not AUTH0_DOMAIN or credentials is None:
        return None

    token = credentials.credentials

    try:
        signing_key = Auth0JWTBearer().jwks_client.get_signing_key_from_jwt(token).key

        payload = None
        for audience in VALID_AUDIENCES:
            if not audience:
                continue
            try:
                payload = jwt.decode(
                    token,
                    signing_key,
                    algorithms=["RS256"],
                    audience=audience,
                    issuer=AUTH0_ISSUER,
                )
                break
            except jwt.InvalidAudienceError:
                continue

        if payload is None:
            return None

        return {
            "sub": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name"),
            "picture": payload.get("picture"),
        }

    except Exception:
        # Token is invalid, but we don't raise error for optional auth
        return None


async def get_user_or_anonymous(
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """
    Get user from token if authenticated, otherwise return anonymous user.
    Use this for routes that should work for everyone but track user identity.

    Anonymous users get a temporary ID based on session/cookie (or random UUID).
    """
    # If Auth0 is not configured or no credentials provided, return anonymous user
    if not AUTH0_DOMAIN or AUTH0_DOMAIN == "your-auth0-domain.auth0.com":
        # Dev mode - return mock user
        return {
            "sub": "dev|user123",
            "email": "dev@example.com",
            "name": "Developer",
            "email_verified": True,
            "is_anonymous": False,
        }

    if credentials is None:
        # No token - return anonymous user
        import uuid

        return {
            "sub": f"anonymous|{uuid.uuid4()}",
            "email": None,
            "name": "Anonymous User",
            "email_verified": False,
            "is_anonymous": True,
        }

    token = credentials.credentials

    try:
        signing_key = Auth0JWTBearer().jwks_client.get_signing_key_from_jwt(token).key
        print("[DEBUG] Token signing key obtained")
        print(f"[DEBUG] Valid audiences: {VALID_AUDIENCES}")

        payload = None
        for audience in VALID_AUDIENCES:
            if not audience:
                continue
            try:
                print(f"[DEBUG] Trying audience: {audience}")
                payload = jwt.decode(
                    token,
                    signing_key,
                    algorithms=["RS256"],
                    audience=audience,
                    issuer=AUTH0_ISSUER,
                )
                print(f"[DEBUG] Successfully decoded with audience: {audience}")
                break
            except jwt.InvalidAudienceError as e:
                print(f"[DEBUG] InvalidAudienceError for {audience}: {e}")
                continue
            except Exception as e:
                print(f"[DEBUG] Other error for {audience}: {e}")
                continue

        if payload is None:
            print("[DEBUG] No valid payload found for any audience")
            raise Exception("Invalid audience")

        return {
            "sub": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name"),
            "picture": payload.get("picture"),
            "email_verified": payload.get("email_verified", False),
            "is_anonymous": False,
        }

    except Exception as e:
        print(f"[DEBUG] Exception in get_user_or_anonymous: {e}")
        import traceback

        traceback.print_exc()
        # Invalid token - return anonymous user instead of erroring
        import uuid

        return {
            "sub": f"anonymous|{uuid.uuid4()}",
            "email": None,
            "name": "Anonymous User",
            "email_verified": False,
            "is_anonymous": True,
        }


# Create instance for dependency injection
_auth0_jwt_bearer = Auth0JWTBearer()
