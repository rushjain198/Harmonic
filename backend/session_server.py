"""
AirJam WebSocket Session Server – real-time multiplayer jam sessions.
- POST /create_room: generate 6-char room code
- GET /ws/{room_id}/{player_id}: join room, send/receive note messages (broadcast to others only)
"""
import asyncio
import json
import random
import string
import time
from typing import Dict, Set, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
import os
import httpx
import websockets as ws_client

# HTTPX client for proxying backend requests (Music API and Streamlit)
client = httpx.AsyncClient()

app = FastAPI(title="AirJam Session Server")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConnectionManager:
    """In-memory room and client management. room_id -> set of (WebSocket, player_id)."""
    def __init__(self):
        self.rooms: Dict[str, Set[tuple]] = {}  # room_id -> set of (ws, player_id)
        self.created_rooms: Set[str] = set()    # room_id -> exists but maybe no players yet

    def _normalize_room_id(self, room_id: str) -> str:
        return (room_id or "").strip().upper()

    async def add(self, room_id: str, websocket: WebSocket, player_id: str) -> None:
        room_id = self._normalize_room_id(room_id)
        if not room_id:
            return
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        
        # Broadcast join before adding so it only goes to OTHERS
        await self.broadcast_to_others(room_id, player_id, {
            "type": "player_joined",
            "player_id": player_id,
            "ts": time.time()
        })
        
        # Re-ensure room exists (broadcast_to_others may delete empty rooms)
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        self.rooms[room_id].add((websocket, player_id))

    async def remove(self, room_id: str, websocket: WebSocket, player_id: str) -> None:
        room_id = self._normalize_room_id(room_id)
        if room_id not in self.rooms:
            return
        self.rooms[room_id].discard((websocket, player_id))
        
        # Broadcast leave
        await self.broadcast_to_others(room_id, player_id, {
            "type": "player_left",
            "player_id": player_id,
            "ts": time.time()
        })
        
        if not self.rooms[room_id]:
            del self.rooms[room_id]

    async def broadcast_to_others(
        self, room_id: str, sender_player_id: str, message: dict
    ) -> None:
        """Send message to all clients in the room except the sender."""
        room_id = self._normalize_room_id(room_id)
        if room_id not in self.rooms:
            return
        to_remove = []
        for ws, pid in list(self.rooms[room_id]):
            if pid == sender_player_id:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                to_remove.append((ws, pid))
        for t in to_remove:
            self.rooms[room_id].discard(t)
        if room_id in self.rooms and not self.rooms[room_id]:
            del self.rooms[room_id]


manager = ConnectionManager()


def generate_room_id() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


@app.post("/create_room")
async def create_room():
    """Generate a new 6-character room code, unique among active rooms."""
    for _ in range(20):
        room_id = generate_room_id()
        if room_id not in manager.rooms and room_id not in manager.created_rooms:
            manager.created_rooms.add(room_id)
            return {"room_id": room_id}
    room_id = generate_room_id()
    manager.created_rooms.add(room_id)
    return {"room_id": room_id}

@app.get("/check_room/{room_id}")
async def check_room(room_id: str):
    """Check if a room exists before allowing a user to join."""
    rid = (room_id or "").strip().upper()
    if rid in manager.rooms or rid in manager.created_rooms:
        return {"exists": True}
    return {"exists": False}

@app.websocket("/ws/{room_id}/{player_id}")
async def websocket_join(
    websocket: WebSocket,
    room_id: str,
    player_id: str,
):
    """
    Join a jam room. Send JSON messages with type "note" to broadcast to other players.
    Schema: { "type": "note", "room_id", "player_id", "instrument", "note", "velocity", "ts" }
    """
    rid = (room_id or "").strip().upper()
    pid = (player_id or "").strip()
    print(f"[Jam] WS attempt: room={rid}, player={pid}")
    
    await websocket.accept()
    print(f"[Jam] WS accepted: room={rid}, player={pid}")

    await manager.add(rid, websocket, pid)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                obj = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if obj.get("type") != "note":
                continue
            # Normalize and add server timestamp if missing
            msg = {
                "type": "note",
                "room_id": rid,
                "player_id": obj.get("player_id") or pid,
                "instrument": obj.get("instrument", "piano"),
                "note": obj.get("note", ""),
                "velocity": float(obj.get("velocity", 0.8)),
                "ts": obj.get("ts", time.time()),
            }
            await manager.broadcast_to_others(rid, msg["player_id"], msg)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        await manager.remove(rid, websocket, pid)

# --- Reverse Proxy Routes for Ngrok Support ---
# This proxies frontend requests to the underlying APIs when running via a single ngrok URL

@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
async def proxy_music_api(path: str, request: Request):
    # Proxy to Music API on 8766
    url = f"http://127.0.0.1:8766/api/{path}"
    headers = dict(request.headers)
    headers.pop("host", None)
    
    # Handle both multipart and JSON bodies
    content = None
    if request.method in ("POST", "PUT", "PATCH"):
        content = await request.body()
    
    req = client.build_request(
        request.method,
        url,
        headers=headers,
        content=content,
        params=request.query_params
    )
    r = await client.send(req, stream=True)
    return StreamingResponse(
        r.aiter_raw(),
        status_code=r.status_code,
        headers=dict(r.headers)
    )

@app.api_route("/streamlit/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
async def proxy_streamlit(path: str, request: Request):
    # Use the exact requested path to preserve trailing slashes (which prevents Tornado redirect loops)
    url = f"http://127.0.0.1:8768{request.url.path}"
    headers = dict(request.headers)
    
    # Set proper forwarding headers to prevent Streamlit redirect loops
    forwarded_host = headers.get("host", "localhost:8502")
    forwarded_proto = headers.get("x-forwarded-proto", "http")
    if "ngrok" in forwarded_host:
        forwarded_proto = "https"
        
    headers["X-Forwarded-Host"] = forwarded_host
    headers["X-Forwarded-Proto"] = forwarded_proto
    headers["X-Forwarded-For"] = request.client.host if request.client else "127.0.0.1"
    headers.pop("host", None)
    
    print(f"[PROXY DEBUG] incoming path: '{path}' -> target URL: {url} | params: {request.query_params}")
    
    req = client.build_request(
        request.method,
        url,
        headers=headers,
        content=await request.body() if request.method in ("POST", "PUT", "PATCH") else None,
        params=request.query_params
    )
    r = await client.send(req, stream=True)
    return StreamingResponse(
        r.aiter_raw(),
        status_code=r.status_code,
        headers=dict(r.headers)
    )

@app.api_route("/streamlit", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
@app.api_route("/streamlit/", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
async def proxy_streamlit_root(request: Request):
    return await proxy_streamlit("", request)

# Streamlit internal sub-resource proxy routes
# These are needed because Streamlit's HTML uses relative paths that resolve to the root.
async def _proxy_to_streamlit(path: str, request: Request):
    target_path = f"/{path}" if path and not path.startswith("/") else path
    url = f"http://127.0.0.1:8768/streamlit{target_path}"
    headers = dict(request.headers)
    
    forwarded_host = headers.get("host", "localhost:8502")
    forwarded_proto = headers.get("x-forwarded-proto", "http")
    if "ngrok" in forwarded_host:
        forwarded_proto = "https"
        
    headers["X-Forwarded-Host"] = forwarded_host
    headers["X-Forwarded-Proto"] = forwarded_proto
    headers["X-Forwarded-For"] = request.client.host if request.client else "127.0.0.1"
    headers.pop("host", None)
    req = client.build_request(
        request.method, url, headers=headers,
        content=await request.body() if request.method in ("POST", "PUT", "PATCH") else None,
        params=request.query_params
    )
    r = await client.send(req, stream=True)
    return StreamingResponse(r.aiter_raw(), status_code=r.status_code, headers=dict(r.headers))

@app.api_route("/_stcore/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
async def proxy_stcore(path: str, request: Request):
    return await _proxy_to_streamlit(f"_stcore/{path}", request)

@app.api_route("/_stapi/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
async def proxy_stapi(path: str, request: Request):
    return await _proxy_to_streamlit(f"_stapi/{path}", request)

@app.api_route("/stream", methods=["GET", "POST"])
async def proxy_stream(request: Request):
    return await _proxy_to_streamlit("stream", request)

# ---- WebSocket proxy for Streamlit's real-time stream ----
# Streamlit uses /_stcore/stream as a WS endpoint for live data updates.
# We proxy it here so ngrok (single port) can forward it correctly.
@app.websocket("/_stcore/stream")
async def proxy_streamlit_ws(client_ws: WebSocket):
    await client_ws.accept()
    streamlit_ws_url = "ws://127.0.0.1:8768/streamlit/_stcore/stream"
    
    # Forward headers (especially Origin, Cookie, and Streamlit-specific ones)
    headers = []
    for k, v in client_ws.headers.items():
        if k.lower() not in ('host', 'upgrade', 'connection', 'sec-websocket-key', 'sec-websocket-version', 'sec-websocket-extensions'):
            headers.append((k, v))
            
    try:
        async with ws_client.connect(streamlit_ws_url, subprotocols=["streamlit"], extra_headers=headers) as server_ws:
            async def forward_to_server():
                try:
                    while True:
                        data = await client_ws.receive_bytes()
                        await server_ws.send(data)
                except Exception:
                    pass

            async def forward_to_client():
                try:
                    async for message in server_ws:
                        if isinstance(message, bytes):
                            await client_ws.send_bytes(message)
                        else:
                            await client_ws.send_text(message)
                except Exception:
                    pass

            await asyncio.gather(forward_to_server(), forward_to_client())
    except Exception as e:
        print(f"[WS Proxy] Streamlit WS error: {e}")
    finally:
        try:
            await client_ws.close()
        except Exception:
            pass

# Also proxy the full-path WS that Streamlit uses when baseUrlPath=/streamlit
@app.websocket("/streamlit/_stcore/stream")
async def proxy_streamlit_ws_full(client_ws: WebSocket):
    await client_ws.accept()
    streamlit_ws_url = "ws://127.0.0.1:8768/streamlit/_stcore/stream"
    
    headers = []
    for k, v in client_ws.headers.items():
        if k.lower() not in ('host', 'upgrade', 'connection', 'sec-websocket-key', 'sec-websocket-version', 'sec-websocket-extensions'):
            headers.append((k, v))
            
    try:
        async with ws_client.connect(streamlit_ws_url, subprotocols=["streamlit"], extra_headers=headers) as server_ws:
            async def fwd_in():
                try:
                    while True:
                        data = await client_ws.receive_bytes()
                        await server_ws.send(data)
                except Exception:
                    pass

            async def fwd_out():
                try:
                    async for message in server_ws:
                        if isinstance(message, bytes):
                            await client_ws.send_bytes(message)
                        else:
                            await client_ws.send_text(message)
                except Exception:
                    pass

            await asyncio.gather(fwd_in(), fwd_out())
    except Exception as e:
        print(f"[WS Proxy /streamlit/_stcore/stream] error: {e}")
    finally:
        try:
            await client_ws.close()
        except Exception:
            pass


# Serve frontend static files
# @app.websocket routes take priority over mounted static files in FastAPI
_root_dir = os.path.dirname(os.path.abspath(__file__))
_frontend_dir = os.path.join(_root_dir, "airplay 2")
_sounds_dir = os.path.join(_root_dir, "sounds")
_drum_sounds_dir = os.path.join(_root_dir, "drum_sounds")

if os.path.isdir(_sounds_dir):
    app.mount("/sounds", StaticFiles(directory=_sounds_dir), name="sounds")

if os.path.isdir(_drum_sounds_dir):
    app.mount("/drum_sounds", StaticFiles(directory=_drum_sounds_dir), name="drum_sounds")

if os.path.isdir(_frontend_dir):
    app.mount("/static", StaticFiles(directory=_frontend_dir, html=True), name="frontend-static")
    app.mount("/", StaticFiles(directory=_frontend_dir, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8502)
