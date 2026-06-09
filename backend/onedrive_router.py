"""
FastAPI router: /api/onedrive/*
Proxies Microsoft Graph calls server-side so the frontend
never needs an access token.
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from onedrive_auth import get_graph_token
import auth
import httpx
import re

router = APIRouter(prefix="/api/onedrive", tags=["onedrive"])

GRAPH = "https://graph.microsoft.com/v1.0"


def _encode_share_id(url: str) -> str:
    import base64
    b64 = base64.urlsafe_b64encode(("u!" + url).encode()).decode()
    return b64.rstrip("=")


async def _graph_get(path: str, token: str) -> dict:
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        res = await client.get(
            path if path.startswith("https://") else f"{GRAPH}{path}",
            headers={"Authorization": f"Bearer {token}",
                     "Accept": "application/json"},
        )
        if not res.ok:
            err = res.json().get("error", {})
            raise HTTPException(
                status_code=res.status_code,
                detail=err.get("message", f"Graph API error {res.status_code}")
            )
        return res.json()


# ── Resolve share URL → driveId + itemId ─────────────────────────────────────
@router.get("/resolve")
async def resolve_share(
    url: str = Query(...),
    current=Depends(auth.require_admin)
):
    token = await get_graph_token()
    share_id = _encode_share_id(url)
    data = await _graph_get(f"{GRAPH}/shares/{share_id}/driveItem?$select=id,name,folder,parentReference", token)

    if "folder" not in data:
        raise HTTPException(400, "The shared link must point to a folder, not a file.")

    drive_id = data.get("parentReference", {}).get("driveId") or data.get("remoteItem", {}).get("parentReference", {}).get("driveId")
    if not drive_id:
        # Try fetching parentReference from the item itself
        drive_id = data.get("id", "").split("!")[0] if "!" in data.get("id","") else ""

    return {
        "driveId": drive_id,
        "itemId": data["id"],
        "name": data["name"],
    }


# ── List children of a folder ─────────────────────────────────────────────────
@router.get("/children")
async def list_children(
    drive_id: str = Query(...),
    item_id: str = Query(...),
    current=Depends(auth.require_admin)
):
    token = await get_graph_token()
    data = await _graph_get(
        f"{GRAPH}/drives/{drive_id}/items/{item_id}/children"
        "?$select=id,name,file,folder&$top=200",
        token
    )
    items = []
    for child in data.get("value", []):
        items.append({
            "id": child["id"],
            "name": child["name"],
            "type": "folder" if "folder" in child else "file",
            "childCount": child.get("folder", {}).get("childCount", 0),
            "mimeType": child.get("file", {}).get("mimeType"),
        })
    # folders first, then files
    items.sort(key=lambda x: (0 if x["type"] == "folder" else 1, x["name"].lower()))
    return {"items": items}