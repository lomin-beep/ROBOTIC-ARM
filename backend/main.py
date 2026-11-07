"""SAEDGE Embodied AI Studio - FastAPI backend.

REST API + WebSocket telemetry for the SAEDGE dashboard. Runs in simulation
mode by default so the full stack can be developed and demoed without a Jetson
or SO-ARM101 attached. Set SAEDGE_SIMULATION=false (and connect real hardware)
to operate on the Jetson Orin Nano Super.
"""

from __future__ import annotations

import asyncio
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from api import cameras as cameras_api
from api import datasets as datasets_api
from api import models as models_api
from api import robot as robot_api
from api import tasks as tasks_api
from api import vision as vision_api
from core.config import settings
from core.event_manager import event_manager
from core.state_manager import robot_state
from hardware.camera_manager import camera_manager
from hardware.servo_manager import servo_manager

logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("saedge.main")

# Background loop control
_background_tasks: list[asyncio.Task] = []


def _import_ai():
    """Lazy import AI modules so the app imports cleanly without heavy deps."""
    from ai.inference_engine import inference_engine  # noqa: F401
    from ai.object_detection import object_detector  # noqa: F401
    return inference_engine, object_detector


# ---------------------------------------------------------------------- #
# Background loops
# ---------------------------------------------------------------------- #
async def _motion_loop() -> None:
    """Smooth simulated joint positions toward targets and publish state."""
    logger.info("Motion loop started")
    while True:
        await asyncio.sleep(0.05)  # 20 Hz control tick
        dt = 0.05
        # Advance simulated arm physics
        servo_manager.leader.tick(dt)
        servo_manager.follower.tick(dt)

        # Teleoperation mirroring
        if robot_state.mode == "teleoperation":
            servo_manager.tick_teleoperation()

        # Sync simulated positions into shared state
        follower_positions = servo_manager.follower.get_positions()
        leader_positions = servo_manager.leader.get_positions()
        for i in range(6):
            robot_state.set_joint_position(i, follower_positions[i])
        # Mirror leader positions into leader state slots too (index offset not needed)

        # Gripper state from joint 6
        robot_state.set_gripper(servo_manager.follower._gripper_open)  # noqa: SLF001

        # Watchdog
        err = safety_check()
        if err is not None and robot_state.mode != "stopped":
            robot_state.set_mode("stopped")
            robot_state.set_command_owner(None)

        # Broadcast
        await event_manager.broadcast("robot-status", robot_state.snapshot())
        await event_manager.broadcast(
            "joint-states",
            {
                "joints": robot_state.snapshot()["joints"],
                "gripper_open": robot_state.gripper_open,
                "mode": robot_state.mode,
            },
        )


async def _camera_loop() -> None:
    """Publish latest camera frames to the dashboard."""
    logger.info("Camera loop started")
    while True:
        await asyncio.sleep(1.0 / max(settings.camera_fps, 1))
        for name in ("environment", "wrist"):
            frame = camera_manager.get_frame(name)
            await event_manager.broadcast(
                "camera-events",
                {
                    "camera": name,
                    "frame": frame,
                    "connected": camera_manager._cameras[name]["connected"],  # noqa: SLF001
                    "ts": time.time(),
                },
            )


async def _vision_loop() -> None:
    """Periodic object detection broadcast."""
    logger.info("Vision loop started")
    inference_engine, object_detector = _import_ai()
    while True:
        await asyncio.sleep(1.0)  # 1 Hz detection
        try:
            detections = object_detector.detect("environment")
            await event_manager.broadcast(
                "vision-results",
                {
                    "camera": "environment",
                    "detections": detections,
                    "ts": time.time(),
                },
            )
        except Exception as exc:  # pragma: no cover - defensive
            logger.error("Vision loop error: %s", exc)


async def _system_monitor_loop() -> None:
    """Publish lightweight system metrics."""
    logger.info("System monitor loop started")
    try:
        import psutil  # type: ignore

        _HAS_PSUTIL = True
    except Exception:  # pragma: no cover
        psutil = None  # type: ignore
        _HAS_PSUTIL = False

    while True:
        await asyncio.sleep(2.0)
        if _HAS_PSUTIL:
            cpu = psutil.cpu_percent()
            ram = psutil.virtual_memory().percent
            try:
                storage = psutil.disk_usage("/").percent
            except Exception:
                storage = 0.0
            try:
                temps = psutil.sensors_temperatures()
                temp = 45.0
                for _, entries in temps.items():
                    for e in entries:
                        if e.current is not None:
                            temp = max(temp, float(e.current))
            except Exception:
                temp = 45.0
            gpu = 0.0  # Jetson GPU telemetry would go here
        else:
            cpu, ram, storage, temp = 25.0, 40.0, 30.0, 45.0
        robot_state.set_system_metrics(
            cpu_percent=cpu,
            ram_percent=ram,
            storage_percent=storage,
            temperature_c=temp,
        )
        await event_manager.broadcast(
            "system-monitor",
            {
                "cpu_percent": cpu,
                "gpu_percent": gpu if _HAS_PSUTIL else 0.0,
                "ram_percent": ram,
                "storage_percent": storage,
                "temperature_c": temp,
                "ts": time.time(),
            },
        )


def safety_check():
    from core.safety import safety  # noqa: PLC0415

    return safety.check()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SAEDGE backend starting (simulation=%s)", settings.simulation)
    # Connect hardware + cameras
    try:
        servo_manager.connect()
        logger.info("Hardware connected: %s", servo_manager.connect() if False else "")
    except Exception as exc:  # pragma: no cover - defensive
        logger.error("Hardware connect error: %s", exc)
    camera_manager.start()

    # Start background loops
    _background_tasks.append(asyncio.create_task(_motion_loop()))
    _background_tasks.append(asyncio.create_task(_camera_loop()))
    _background_tasks.append(asyncio.create_task(_vision_loop()))
    _background_tasks.append(asyncio.create_task(_system_monitor_loop()))

    yield

    # Shutdown
    logger.info("SAEDGE backend shutting down")
    for task in _background_tasks:
        task.cancel()
    camera_manager.stop()
    try:
        servo_manager.disconnect()
    except Exception as exc:  # pragma: no cover
        logger.error("Disconnect error: %s", exc)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------- #
# Routers
# ---------------------------------------------------------------------- #
app.include_router(robot_api.router, prefix="/api")
app.include_router(cameras_api.router, prefix="/api")
app.include_router(vision_api.router, prefix="/api")
app.include_router(tasks_api.router, prefix="/api")
app.include_router(datasets_api.router, prefix="/api")
app.include_router(models_api.router, prefix="/api")


# ---------------------------------------------------------------------- #
# Health
# ---------------------------------------------------------------------- #
@app.get("/api/system/status")
async def system_status():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "simulation": settings.simulation,
        "leader_connected": robot_state.leader_connected,
        "follower_connected": robot_state.follower_connected,
        "mode": robot_state.mode,
        "emergency_stop": robot_state.emergency_stop,
        "uptime_ts": robot_state.connected_ts,
    }


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------- #
# WebSocket endpoints
# ---------------------------------------------------------------------- #
@app.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    await websocket.accept()
    await event_manager.connect(channel, websocket)
    try:
        while True:
            # Keep connection alive; echo ping/pong support
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await event_manager.disconnect(channel, websocket)
