from fastapi import WebSocket
from typing import Dict, List
import json


class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, run_id: int, websocket: WebSocket):
        await websocket.accept()
        if run_id not in self.active_connections:
            self.active_connections[run_id] = []
        self.active_connections[run_id].append(websocket)

    def disconnect(self, run_id: int, websocket: WebSocket):
        if run_id in self.active_connections:
            try:
                self.active_connections[run_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[run_id]:
                del self.active_connections[run_id]

    async def broadcast(self, run_id: int, message: dict):
        if run_id in self.active_connections:
            dead = []
            for connection in self.active_connections[run_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead.append(connection)
            for conn in dead:
                try:
                    self.active_connections[run_id].remove(conn)
                except ValueError:
                    pass

    def get_active_run_ids(self) -> List[int]:
        return list(self.active_connections.keys())


manager = WebSocketManager()
