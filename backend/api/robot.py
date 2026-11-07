"""Robot control API endpoints."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from core.safety import safety
from core.state_manager import robot_state
from hardware.servo_manager import servo_manager

router = APIRouter(tags=["robot"])


# ---------------------------------------------------------------------- #
# Schemas
# ---------------------------------------------------------------------- #
class ConnectResponse(BaseModel):
    leader_connected: bool
    follower_connected: bool
    simulation: bool


class HomeResponse(BaseModel):
    positions: List[float]


class JointCommand(BaseModel):
    index: int = Field(..., ge=0, le=5)
    position: float
    owner: str = Field(default="manual")


class JointsCommand(BaseModel):
    positions: List[float]
    owner: str = Field(default="manual")


class GripperCommand(BaseModel):
    open: bool
    owner: str = Field(default="manual")


# ---------------------------------------------------------------------- #
# Endpoints
# ---------------------------------------------------------------------- #
@router.get("/robot/status", response_model=dict)
async def robot_status():
    return {
        "leader_connected": servo_manager.leader.is_connected(),
        "follower_connected": servo_manager.follower.is_connected(),
        "mode": robot_state.mode,
        "calibrated": servo_manager.is_calibrated(),
        "emergency_stop": safety.is_emergency_stop_active(),
        "command_owner": robot_state.command_owner,
        "gripper_open": robot_state.gripper_open,
        "joints": robot_state.snapshot()["joints"],
    }


@router.post("/robot/connect", response_model=ConnectResponse)
async def robot_connect():
    try:
        result = servo_manager.connect()
        return ConnectResponse(**result)
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)
        )


@router.post("/robot/disconnect", response_model=dict)
async def robot_disconnect():
    servo_manager.disconnect()
    return {"disconnected": True}


@router.post("/robot/calibrate", response_model=dict)
async def robot_calibrate():
    try:
        return servo_manager.calibrate()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)
        )


@router.post("/robot/home", response_model=HomeResponse)
async def robot_home():
    try:
        return servo_manager.home()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)
        )


@router.post("/robot/joint", response_model=dict)
async def robot_joint(cmd: JointCommand):
    try:
        return servo_manager.set_follower_joint(cmd.index, cmd.position, cmd.owner)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)
        )


@router.post("/robot/joints", response_model=dict)
async def robot_joints(cmd: JointsCommand):
    try:
        return servo_manager.set_follower_joints(cmd.positions, cmd.owner)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)
        )


@router.post("/robot/gripper", response_model=dict)
async def robot_gripper(cmd: GripperCommand):
    try:
        return servo_manager.set_gripper(cmd.open, cmd.owner)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)
        )


@router.post("/robot/teleoperation/start", response_model=dict)
async def teleop_start():
    try:
        return servo_manager.start_teleoperation()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)
        )


@router.post("/robot/teleoperation/stop", response_model=dict)
async def teleop_stop():
    return servo_manager.stop_teleoperation()


@router.post("/robot/stop", response_model=dict)
async def robot_stop(owner: Optional[str] = None):
    return servo_manager.stop(owner)


@router.post("/robot/emergency-stop", response_model=dict)
async def robot_emergency_stop():
    return servo_manager.emergency_stop()


@router.post("/robot/emergency-stop/clear", response_model=dict)
async def robot_emergency_stop_clear():
    return servo_manager.clear_emergency_stop()
