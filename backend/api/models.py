"""Model management / inference API endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from ai.act_policy import act_policy

router = APIRouter(tags=["models"])


@router.post("/models/infer", response_model=dict)
async def run_inference(checkpoint: str = "default"):
    if not act_policy.is_loaded():
        act_policy.load(checkpoint)
    from core.state_manager import robot_state

    obs = {"joints": robot_state.snapshot()["joints"]}
    action = act_policy.predict(obs)
    return {"checkpoint": checkpoint, "action": action}


@router.post("/models/load", response_model=dict)
async def load_model(checkpoint: str):
    ok = act_policy.load(checkpoint)
    return {"loaded": ok, "checkpoint": checkpoint}


@router.get("/models/status", response_model=dict)
async def model_status():
    return {"loaded": act_policy.is_loaded(), "checkpoint": act_policy.checkpoint}
