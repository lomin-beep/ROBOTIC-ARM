"""SAEDGE Embodied AI Studio - WebSocket event manager.

Broadcasts JSON state updates to all connected dashboard clients. Channels:

  /ws/robot-status   -> full robot + system state snapshot
  /ws/joint-states   -> joint positions only
  /ws/camera-events  -> camera connection / frame events
  /ws/vision-results -> object detection results
  /ws/task-progress  -> task execution progress
  /ws/system-monitor -> CPU / GPU / RAM / temperature
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Dict, Set

from fastapi import WebSocket

logger = logging.getLogger("saedge.events")


class EventManager:
    def __init__(self) -> None:
        # channel -> set of websockets
        self._subscribers: Dict[str, Set[WebSocket]] = {
            "robot-status": set(),
            "joint-states": set(),
            "camera-events": set(),
            "vision-results": set(),
            "task-progress": set(),
            "system-monitor": set(),
        }
        self._lock = asyncio.Lock()

    async def connect(self, channel: str, websocket: WebSocket) -> None:
        await self._lock.acquire()
        try:
            self._subscribers.setdefault(channel, set()).add(websocket)
        finally:
            self._lock.release()
        logger.debug("Client subscribed to %s (%d total)", channel, self._count(channel))

    async def disconnect(self, channel: str, websocket: WebSocket) -> None:
        await self._lock.acquire()
        try:
            self._subscribers.get(channel, set()).discard(websocket)
        finally:
            self._lock.release()

    async def broadcast(self, channel: str, message: dict) -> None:
        await self._lock.acquire()
        try:
            sockets = list(self._subscribers.get(channel, set()))
        finally:
            self._lock.release()

        if not sockets:
            return

        payload = json.dumps(message)
        dead: list[WebSocket] = []
        for ws in sockets:
            try:
                await ws.send_text(payload)
            except Exception:  # client gone
                dead.append(ws)
        for ws in dead:
            await self.disconnect(channel, ws)

    def _count(self, channel: str) -> int:
        return len(self._subscribers.get(channel, set()))


# Module-level singleton
event_manager = EventManager()
