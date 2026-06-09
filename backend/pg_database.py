# # backend/pg_database.py
# # PostgreSQL connection for folder/file storage
# # Install: pip install psycopg2-binary

# import psycopg2
# import psycopg2.extras
# from typing import Optional
# import os

# # ── Connection settings ───────────────────────────────────────
# # Override via environment variables if needed:
# #   PG_HOST, PG_PORT, PG_DB, PG_USER, PG_PASSWORD

# PG_CONFIG = {
#     "host":     os.getenv("PG_HOST",     "localhost"),
#     "port":     int(os.getenv("PG_PORT", "5432")),
#     "dbname":   os.getenv("PG_DB",       "fileclassify_files"),
#     "user":     os.getenv("PG_USER",     "postgres"),
#     "password": os.getenv("PG_PASSWORD", "postgres"),
# }


# def get_pg_connection():
#     """Return a new psycopg2 connection. Caller must close it."""
#     return psycopg2.connect(**PG_CONFIG)


# def get_pg_cursor(conn):
#     """Return a DictCursor so rows behave like dicts."""
#     return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)


# backend/pg_database.py
# PostgreSQL connection for folder/file storage

import psycopg2
import psycopg2.extras
import os
import getpass

# On Mac (Homebrew / Postgres.app), the default superuser is your Mac
# username, NOT "postgres". We auto-detect it as the fallback.
_default_user = getpass.getuser()   # e.g. "thilakg"

PG_CONFIG = {
    "host":     os.getenv("PG_HOST",     "localhost"),
    "port":     int(os.getenv("PG_PORT", "5432")),
    "dbname":   os.getenv("PG_DB",       "fileclassify_files"),
    "user":     os.getenv("PG_USER",     _default_user),
    "password": os.getenv("PG_PASSWORD", ""),   # Postgres.app = no password
}


def get_pg_connection():
    """Return a new psycopg2 connection. Caller must close it."""
    return psycopg2.connect(**PG_CONFIG)


def get_pg_cursor(conn):
    """Return a DictCursor so rows behave like dicts."""
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)