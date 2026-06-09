"""
Microsoft Graph OAuth2 client-credentials flow.
Requires an Azure AD app registration with:
  - Application permission: Files.Read.All (not delegated)
  - Admin consent granted

Environment variables (add to backend .env):
  MS_TENANT_ID=your-tenant-id
  MS_CLIENT_ID=your-app-client-id
  MS_CLIENT_SECRET=your-app-client-secret
"""
import os
import time
import httpx

_token_cache: dict = {"token": None, "expires_at": 0}


async def get_graph_token() -> str:
    """Return a valid MS Graph access token, refreshing if expired."""
    now = time.time()
    if _token_cache["token"] and now < _token_cache["expires_at"] - 60:
        return _token_cache["token"]

    tenant_id = os.getenv("MS_TENANT_ID", "")
    client_id = os.getenv("MS_CLIENT_ID", "")
    client_secret = os.getenv("MS_CLIENT_SECRET", "")

    if not all([tenant_id, client_id, client_secret]):
        raise ValueError(
            "Missing MS_TENANT_ID, MS_CLIENT_ID, or MS_CLIENT_SECRET "
            "in environment. See backend/.env.example"
        )

    url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(url, data={
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
            "scope": "https://graph.microsoft.com/.default",
        })
        res.raise_for_status()
        data = res.json()

    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = now + data.get("expires_in", 3600)
    return _token_cache["token"]