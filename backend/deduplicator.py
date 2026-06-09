#!/usr/bin/env python3
"""
Enhanced PDF/File Deduplication Engine
Supports in-memory processing for web API integration.
"""
import os
import io
import hashlib
import shutil
import zipfile
import tempfile
from collections import defaultdict
from typing import Optional


def calculate_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def calculate_sha256_file(file_path: str, chunk_size: int = 65536) -> Optional[str]:
    sha256 = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            while chunk := f.read(chunk_size):
                sha256.update(chunk)
        return sha256.hexdigest()
    except OSError:
        return None


def get_file_category(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    categories = {
        ".pdf": "PDF Document",
        ".txt": "Plain Text",
        ".csv": "CSV Spreadsheet",
        ".xlsx": "Excel Spreadsheet",
        ".xls": "Excel Spreadsheet",
        ".docx": "Word Document",
        ".doc": "Word Document",
        ".png": "Image",
        ".jpg": "Image",
        ".jpeg": "Image",
        ".gif": "Image",
        ".webp": "Image",
        ".zip": "Archive",
        ".rar": "Archive",
        ".tar": "Archive",
        ".gz": "Archive",
        ".7z": "Archive",
        ".mp3": "Audio",
        ".wav": "Audio",
        ".mp4": "Video",
        ".mkv": "Video",
        ".mov": "Video",
    }
    return categories.get(ext, f"{ext[1:].upper() if ext else 'Unknown'} File")


def deduplicate_zip_bytes(zip_bytes: bytes, recursive: bool = True) -> dict:
    """
    Process a ZIP file (as bytes) and deduplicate its contents.
    Returns a dict with:
      - unique_files: list of {name, data, size, category}
      - duplicate_files: list of {name, data, size, category, duplicate_of}
      - stats: {scanned, unique, duplicates, bytes_saved}
      - result_zip: bytes of a new ZIP containing only unique files
      - duplicates_zip: bytes of a ZIP containing only duplicate files
    """
    try:
        input_zip = zipfile.ZipFile(io.BytesIO(zip_bytes), "r")
    except zipfile.BadZipFile:
        return {"error": "Invalid ZIP file"}

    # Read all files from the zip
    all_entries = []
    for info in input_zip.infolist():
        if info.is_dir():
            continue
        try:
            data = input_zip.read(info.filename)
        except Exception:
            continue

        name = info.filename
        # For non-recursive: skip files in subdirectories
        if not recursive and "/" in name.rstrip("/"):
            parts = name.split("/")
            if len(parts) > 2 or (len(parts) == 2 and parts[1] != ""):
                continue

        all_entries.append({
            "name": name,
            "basename": os.path.basename(name),
            "data": data,
            "size": len(data),
            "category": get_file_category(name),
            "hash": calculate_sha256(data),
        })

    input_zip.close()

    # Deduplicate by hash
    seen_hashes: dict[str, dict] = {}  # hash -> first entry
    unique_files = []
    duplicate_files = []

    for entry in all_entries:
        h = entry["hash"]
        if h not in seen_hashes:
            seen_hashes[h] = entry
            unique_files.append(entry)
        else:
            original = seen_hashes[h]
            duplicate_files.append({
                **entry,
                "duplicate_of": original["name"],
                "duplicate_of_basename": original["basename"],
            })

    stats = {
        "scanned": len(all_entries),
        "unique": len(unique_files),
        "duplicates": len(duplicate_files),
        "bytes_saved": sum(d["size"] for d in duplicate_files),
    }

    # Build result ZIP (unique files only)
    result_buf = io.BytesIO()
    with zipfile.ZipFile(result_buf, "w", zipfile.ZIP_DEFLATED) as zout:
        for f in unique_files:
            zout.writestr(f["name"], f["data"])
    result_zip = result_buf.getvalue()

    # Build duplicates ZIP
    dups_buf = io.BytesIO()
    with zipfile.ZipFile(dups_buf, "w", zipfile.ZIP_DEFLATED) as zout:
        for f in duplicate_files:
            zout.writestr(f["name"], f["data"])
    duplicates_zip = dups_buf.getvalue()

    return {
        "unique_files": [
            {"name": f["name"], "basename": f["basename"], "size": f["size"], "category": f["category"]}
            for f in unique_files
        ],
        "duplicate_files": [
            {
                "name": f["name"],
                "basename": f["basename"],
                "size": f["size"],
                "category": f["category"],
                "duplicate_of": f["duplicate_of"],
                "duplicate_of_basename": f["duplicate_of_basename"],
            }
            for f in duplicate_files
        ],
        "stats": stats,
        "result_zip": result_zip,
        "duplicates_zip": duplicates_zip,
    }


def deduplicate_directory(source_dir: str, recursive: bool = True) -> dict:
    """
    Deduplicate files in a local directory.
    Returns same structure as deduplicate_zip_bytes.
    """
    all_entries = []

    if recursive:
        for root, _, files in os.walk(source_dir):
            for fname in files:
                fpath = os.path.join(root, fname)
                try:
                    with open(fpath, "rb") as f:
                        data = f.read()
                    rel = os.path.relpath(fpath, source_dir)
                    all_entries.append({
                        "name": rel,
                        "basename": fname,
                        "data": data,
                        "size": len(data),
                        "category": get_file_category(fname),
                        "hash": calculate_sha256(data),
                    })
                except Exception:
                    continue
    else:
        for fname in os.listdir(source_dir):
            fpath = os.path.join(source_dir, fname)
            if not os.path.isfile(fpath):
                continue
            try:
                with open(fpath, "rb") as f:
                    data = f.read()
                all_entries.append({
                    "name": fname,
                    "basename": fname,
                    "data": data,
                    "size": len(data),
                    "category": get_file_category(fname),
                    "hash": calculate_sha256(data),
                })
            except Exception:
                continue

    seen_hashes: dict[str, dict] = {}
    unique_files = []
    duplicate_files = []

    for entry in all_entries:
        h = entry["hash"]
        if h not in seen_hashes:
            seen_hashes[h] = entry
            unique_files.append(entry)
        else:
            original = seen_hashes[h]
            duplicate_files.append({
                **entry,
                "duplicate_of": original["name"],
                "duplicate_of_basename": original["basename"],
            })

    stats = {
        "scanned": len(all_entries),
        "unique": len(unique_files),
        "duplicates": len(duplicate_files),
        "bytes_saved": sum(d["size"] for d in duplicate_files),
    }

    result_buf = io.BytesIO()
    with zipfile.ZipFile(result_buf, "w", zipfile.ZIP_DEFLATED) as zout:
        for f in unique_files:
            zout.writestr(f["name"], f["data"])
    result_zip = result_buf.getvalue()

    dups_buf = io.BytesIO()
    with zipfile.ZipFile(dups_buf, "w", zipfile.ZIP_DEFLATED) as zout:
        for f in duplicate_files:
            zout.writestr(f["name"], f["data"])
    duplicates_zip = dups_buf.getvalue()

    return {
        "unique_files": [
            {"name": f["name"], "basename": f["basename"], "size": f["size"], "category": f["category"]}
            for f in unique_files
        ],
        "duplicate_files": [
            {
                "name": f["name"],
                "basename": f["basename"],
                "size": f["size"],
                "category": f["category"],
                "duplicate_of": f["duplicate_of"],
                "duplicate_of_basename": f["duplicate_of_basename"],
            }
            for f in duplicate_files
        ],
        "stats": stats,
        "result_zip": result_zip,
        "duplicates_zip": duplicates_zip,
    }