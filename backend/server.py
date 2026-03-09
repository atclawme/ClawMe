from fastapi import FastAPI, APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import re
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
import httpx
from collections import defaultdict
from time import time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ----- Rate limiter (in-memory) -----
_rate_store: dict = defaultdict(list)


def check_rate_limit(ip: str, max_req: int = 10, window: int = 60) -> bool:
    now = time()
    _rate_store[ip] = [t for t in _rate_store[ip] if now - t < window]
    if len(_rate_store[ip]) >= max_req:
        return False
    _rate_store[ip].append(now)
    return True


# ----- Supabase config -----
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

SUPABASE_CONFIGURED = bool(
    SUPABASE_URL and
    SUPABASE_URL not in ('placeholder_supabase_url', 'your_supabase_project_url')
)

# ----- Validation -----
HANDLE_REGEX = re.compile(r'^[a-z0-9_]{2,24}$')
RESERVED_HANDLES = {'admin', 'api', 'resolve', 'verify', 'support', 'clawme', 'help', 'root', 'www'}
EMAIL_REGEX = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')

# ----- In-memory mock store (used when Supabase is not configured) -----
_mock_emails: set = set()
_mock_handles: set = set()


# ----- Models -----
class WaitlistRequest(BaseModel):
    email: str
    desired_handle: Optional[str] = None
    source: Optional[str] = None


# ----- Routes -----
@api_router.get("/")
async def root():
    return {"message": "ClawMe API v1"}


@api_router.post("/waitlist")
async def join_waitlist(req: WaitlistRequest):
    # Validate email
    if not EMAIL_REGEX.match(req.email):
        raise HTTPException(status_code=422, detail="Invalid email format")

    handle = None
    if req.desired_handle:
        handle = req.desired_handle.strip().lower()
        if not HANDLE_REGEX.match(handle):
            raise HTTPException(status_code=422, detail="Invalid handle format")
        if handle in RESERVED_HANDLES:
            raise HTTPException(status_code=422, detail="Handle is reserved")

    if not SUPABASE_CONFIGURED:
        # Mock mode: use in-memory store
        if req.email in _mock_emails:
            return JSONResponse(status_code=409, content={"error": "already_registered"})
        if handle and handle in _mock_handles:
            return JSONResponse(status_code=409, content={"error": "handle_taken"})
        _mock_emails.add(req.email)
        if handle:
            _mock_handles.add(handle)
        return JSONResponse(status_code=201, content={"success": True, "handle": handle})

    # Supabase insert
    payload: dict = {"email": req.email}
    if handle:
        payload["desired_handle"] = handle
    if req.source:
        payload["source"] = req.source

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{SUPABASE_URL}/rest/v1/waitlist",
            json=payload,
            headers=headers,
        )

    if res.status_code == 409:
        detail = res.text.lower()
        if "desired_handle" in detail:
            return JSONResponse(status_code=409, content={"error": "handle_taken"})
        return JSONResponse(status_code=409, content={"error": "already_registered"})

    if res.status_code not in (200, 201):
        logging.error(f"Supabase error: {res.status_code} {res.text}")
        raise HTTPException(status_code=500, detail="Database error")

    return JSONResponse(status_code=201, content={"success": True, "handle": handle})


@api_router.get("/waitlist/count")
async def get_waitlist_count():
    if not SUPABASE_CONFIGURED:
        return {"count": len(_mock_emails)}

    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/waitlist",
            params={"select": "id"},
            headers={
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "Prefer": "count=exact",
                "Range-Unit": "items",
                "Range": "0-0",
            },
        )
    content_range = res.headers.get("content-range", "0/0")
    count = int(content_range.split("/")[-1]) if "/" in content_range else 0
    return {"count": count}


@api_router.get("/waitlist/check")
async def check_handle(request: Request, handle: str):
    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests")

    handle = handle.strip().lower()
    if not HANDLE_REGEX.match(handle):
        raise HTTPException(status_code=422, detail="Invalid handle format")

    if handle in RESERVED_HANDLES:
        return {"available": False}

    if not SUPABASE_CONFIGURED:
        return {"available": handle not in _mock_handles}

    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    }

    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/waitlist",
            params={"desired_handle": f"eq.{handle}", "select": "id"},
            headers=headers,
        )

    if res.status_code != 200:
        raise HTTPException(status_code=500, detail="Database error")

    data = res.json()
    return {"available": len(data) == 0}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)
