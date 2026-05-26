from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active:
            self.active[user_id] = []
        self.active[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active:
            self.active[user_id].remove(websocket)

    async def broadcast_to_user(self, user_id: str, data: dict):
        if user_id in self.active:
            for ws in self.active[user_id]:
                try:
                    await ws.send_text(json.dumps(data))
                except:
                    pass
