"""
FastAPI — HTTP proxy to Next.js.
All business logic lives in Next.js API routes.
This service proxies /api/* requests from the Kubernetes ingress to Next.js on port 3000.
"""
from fastapi import FastAPI, Request
from fastapi.responses import Response
import httpx
import logging
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

NEXT_URL = "http://localhost:3000"

# Headers that should NOT be forwarded (hop-by-hop)
HOP_BY_HOP = frozenset({
    'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
    'te', 'trailers', 'transfer-encoding', 'upgrade',
})


@app.api_route(
    "/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def proxy(request: Request, path: str):
    url = f"{NEXT_URL}/{path}"
    if request.url.query:
        url += f"?{request.url.query}"

    # Forward all headers except hop-by-hop (keep Cookie, Authorization, Content-Type, etc.)
    headers = {
        k: v for k, v in request.headers.items()
        if k.lower() not in HOP_BY_HOP and k.lower() != "host"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            body = await request.body()
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body or None,
                follow_redirects=False,
            )

        # Forward all response headers (Set-Cookie, Content-Type, etc.)
        resp_headers = {
            k: v for k, v in response.headers.items()
            if k.lower() not in HOP_BY_HOP
        }

        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=resp_headers,
            media_type=response.headers.get("content-type"),
        )

    except httpx.ConnectError:
        logger.error(f"Cannot reach Next.js at {NEXT_URL}")
        return Response(
            content=b'{"error":"Service temporarily unavailable"}',
            status_code=503,
            media_type="application/json",
        )
    except Exception as exc:
        logger.error(f"Proxy error: {exc}")
        return Response(
            content=b'{"error":"Internal proxy error"}',
            status_code=500,
            media_type="application/json",
        )
