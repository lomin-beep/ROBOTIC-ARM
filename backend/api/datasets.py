"""Dataset recording API endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from learning.dataset_manager import dataset_manager
from learning.recorder import recorder

router = APIRouter(tags=["datasets"])


@router.post("/datasets/record", response_model=dict)
async def start_recording(task_description: str = "untitled_task"):
    episode_id = recorder.start(task_description)
    return {"recording": True, "episode_id": episode_id}


@router.post("/datasets/stop", response_model=dict)
async def stop_recording():
    episode_id = recorder.stop()
    return {"recording": False, "episode_id": episode_id}


@router.get("/datasets/episodes", response_model=dict)
async def list_episodes():
    return {"episodes": dataset_manager.list_episodes()}
