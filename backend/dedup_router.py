"""
FastAPI router: /api/admin/dedup/*
Handles file deduplication via the enhanced deduplicator engine.
"""
import io
import json
import uuid
import zipfile
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from typing import Optional

import auth
from deduplicator import deduplicate_zip_bytes

router = APIRouter(prefix="/api/admin/dedup", tags=["deduplication"])


# In-memory session store for dedup results (keyed by session_id)
# In production you'd use Redis or a DB; this works for single-process deployments
_sessions: dict[str, dict] = {}


@router.post("/analyze")
async def analyze_duplicates(
    file: UploadFile = File(...),
    recursive: str = Form("true"),
    current=Depends(auth.require_admin),
):
    """
    Upload a ZIP file, run deduplication analysis, return JSON report.
    Does NOT move/delete anything — analysis only.
    """
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    # Accept ZIP directly OR wrap non-zip bytes
    filename = file.filename or "upload.zip"
    if not filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Please upload a ZIP file")

    do_recursive = recursive.lower() not in ("false", "0", "no")

    result = deduplicate_zip_bytes(content, recursive=do_recursive)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    # Store full result (including zip bytes) in session
    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "result_zip": result["result_zip"],
        "duplicates_zip": result["duplicates_zip"],
        "original_filename": filename,
        "stats": result["stats"],
    }

    # Return lightweight JSON (no binary blobs)
    return {
        "session_id": session_id,
        "stats": result["stats"],
        "unique_files": result["unique_files"],
        "duplicate_files": result["duplicate_files"],
    }


@router.get("/download/{session_id}/unique")
def download_unique_zip(
    session_id: str,
    current=Depends(auth.require_admin),
):
    """Download a ZIP containing only the unique (deduplicated) files."""
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    buf = io.BytesIO(session["result_zip"])
    orig = session["original_filename"].replace(".zip", "")
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{orig}_unique.zip"'},
    )


@router.get("/download/{session_id}/duplicates")
def download_duplicates_zip(
    session_id: str,
    current=Depends(auth.require_admin),
):
    """Download a ZIP containing only the duplicate files."""
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    buf = io.BytesIO(session["duplicates_zip"])
    orig = session["original_filename"].replace(".zip", "")
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{orig}_duplicates.zip"'},
    )


@router.delete("/session/{session_id}")
def clear_session(
    session_id: str,
    current=Depends(auth.require_admin),
):
    """Clean up a dedup session from memory."""
    _sessions.pop(session_id, None)
    return {"ok": True}