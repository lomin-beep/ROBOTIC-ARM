"""SAEDGE Embodied AI Studio - shared robot / system state.

Thread-safe singleton-style state container. The FastAPI application, the
background motion loop, and the WebSocket broadcaster all read / write through
this object so there is a single source of truth.
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class JointState:
    position: float = 0.0
    target: float = 0.0
    velocity: float = 0.0
    load: float = 0.0
    temperature: float = 40.0
    error: bool = False


@dataclass
class CameraState:
    index: int
    name: str
    connected: bool = False
    fps: float = 0.0
    resolution: str = "640x480"
    last_frame_ts: Optional[float] = None


@dataclass
class SystemState:
    cpu_percent: float = 0.0
    gpu_percent: float = 0.0
    ram_percent: float = 0.0
    storage_percent: float = 0.0
    temperature_c: float = 45.0


class RobotState:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        # Connection
        self.leader_connected: bool = False
        self.follower_connected: bool = False
        # Operating mode: manual | teleoperation | ai_inference | recording | stopped
        self.mode: str = "stopped"
        # Emergency stop
        self.emergency_stop: bool = False
        # Exclusive command ownership: None | "manual" | "teleoperation" | "ai"
        self.command_owner: Optional[str] = None
        # Joints (index 0..5 for J1..J6)
        self.joints: List[JointState] = [JointState() for _ in range(6)]
        # Gripper is J6
        self.gripper_open: bool = True
        # Cameras
        self.cameras: Dict[str, CameraState] = {
            "environment": CameraState(index=0, name="Environment camera"),
            "wrist": CameraState(index=2, name="Wrist camera"),
        }
        # System
        self.system = SystemState()
        # Timestamps
        self.last_command_ts: Optional[float] = None
        self.connected_ts: Optional[float] = None

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #
    def _snapshot(self) -> dict:
        with self._lock:
            return {
                "mode": self.mode,
                "leader_connected": self.leader_connected,
                "follower_connected": self.follower_connected,
                "emergency_stop": self.emergency_stop,
                "command_owner": self.command_owner,
                "gripper_open": self.gripper_open,
                "joints": [
                    {
                        "index": i,
                        "position": j.position,
                        "target": j.target,
                        "velocity": j.velocity,
                        "load": j.load,
                        "temperature": j.temperature,
                        "error": j.error,
                    }
                    for i, j in enumerate(self.joints)
                ],
                "cameras": {
                    name: {
                        "index": cam.index,
                        "name": cam.name,
                        "connected": cam.connected,
                        "fps": cam.fps,
                        "resolution": cam.resolution,
                        "last_frame_ts": cam.last_frame_ts,
                    }
                    for name, cam in self.cameras.items()
                },
                "system": {
                    "cpu_percent": self.system.cpu_percent,
                    "gpu_percent": self.system.gpu_percent,
                    "ram_percent": self.system.ram_percent,
                    "storage_percent": self.system.storage_percent,
                    "temperature_c": self.system.temperature_c,
                },
                "last_command_ts": self.last_command_ts,
                "connected_ts": self.connected_ts,
            }

    def snapshot(self) -> dict:
        return self._snapshot()

    # ------------------------------------------------------------------ #
    # Mutations (all acquire the lock)
    # ------------------------------------------------------------------ #
    def set_connection(self, leader: bool, follower: bool) -> None:
        with self._lock:
            self.leader_connected = leader
            self.follower_connected = follower
            if leader and follower and self.connected_ts is None:
                self.connected_ts = time.time()
            elif not (leader and follower):
                self.connected_ts = None

    def set_mode(self, mode: str) -> None:
        with self._lock:
            self.mode = mode

    def set_emergency_stop(self, active: bool) -> None:
        with self._lock:
            self.emergency_stop = bool(active)
            if active:
                self.command_owner = None
                self.mode = "stopped"

    def set_command_owner(self, owner: Optional[str]) -> None:
        with self._lock:
            self.command_owner = owner
            self.last_command_ts = time.time() if owner else None

    def set_gripper(self, open_: bool) -> None:
        with self._lock:
            self.gripper_open = bool(open_)
            # Reflect in joint 6 target (gripper joint)
            self.joints[5].target = 0.0 if open_ else 1.0

    def set_joint_target(self, index: int, target: float) -> None:
        with self._lock:
            if 0 <= index < len(self.joints):
                self.joints[index].target = float(target)
                self.last_command_ts = time.time()

    def set_joint_position(self, index: int, position: float) -> None:
        with self._lock:
            if 0 <= index < len(self.joints):
                self.joints[index].position = float(position)

    def set_camera_connected(self, name: str, connected: bool, fps: float = 0.0) -> None:
        with self._lock:
            if name in self.cameras:
                cam = self.cameras[name]
                cam.connected = bool(connected)
                if connected:
                    cam.fps = fps
                    cam.last_frame_ts = time.time()

    def update_camera_frame(self, name: str) -> None:
        with self._lock:
            if name in self.cameras:
                self.cameras[name].last_frame_ts = time.time()

    def set_system_metrics(self, **kwargs) -> None:
        with self._lock:
            for key, value in kwargs.items():
                if hasattr(self.system, key):
                    setattr(self.system, key, value)


# Module-level singleton
robot_state = RobotState()
