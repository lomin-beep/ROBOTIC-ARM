"""Camera API endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from hardware.camera_manager import camera_manager

router = APIRouter(tags=["cameras"])


@router.get("/cameras", response_model=dict)
async def list_cameras():
    return {"cameras": camera_manager.list_cameras()}


@router.post("/cameras/start", response_model=dict)
async def start_cameras():
    return camera_manager.start()


@router.post("/cameras/stop", response_model=dict)
async def stop_cameras():
    camera_manager.stop()
    return {"stopped": True}


@router.get("/cameras/{name}/frame", response_model=dict)
async def get_frame(name: str):
    frame = camera_manager.get_frame(name)
    if frame is None:
        return {"camera": name, "connected": False, "frame": None}
    return {
        "camera": name,
        "connected": True,
        "frame": frame,
        "ts": __import__("time").time(),
    }
