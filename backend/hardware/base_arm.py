"""Base class for SO-ARM101 leader / follower arms.

Real hardware implementations should subclass this and implement the abstract
hardware methods using the LeRobot SO-ARM101 driver / BusLinker serial protocol.
"""

from __future__ import annotations

import time
from typing import Dict, List, Optional

from core.config import settings
from core.state_manager import JointState, robot_state


class BaseArm:
    def __init__(self, name: str, device: str, baudrate: int) -> None:
        self.name = name
        self.device = device
        self.baudrate = baudrate
        self._connected = False
        self._positions: List[float] = [0.0] * 6
        self._gripper_open = True

    # ------------------------------------------------------------------ #
    # Lifecycle
    # ------------------------------------------------------------------ #
    def connect(self) -> bool:
        raise NotImplementedError

    def disconnect(self) -> bool:
        raise NotImplementedError

    def is_connected(self) -> bool:
        return self._connected

    # ------------------------------------------------------------------ #
    # Motion
    # ------------------------------------------------------------------ #
    def get_positions(self) -> List[float]:
        raise NotImplementedError

    def set_joint_target(self, index: int, position: float) -> None:
        raise NotImplementedError

    def set_joint_targets(self, positions: List[float]) -> None:
        raise NotImplementedError

    def set_gripper(self, open_: bool) -> None:
        raise NotImplementedError

    def stop(self) -> None:
        raise NotImplementedError

    def emergency_stop(self) -> None:
        raise NotImplementedError

    def home(self) -> None:
        raise NotImplementedError

    def calibrate(self) -> bool:
        raise NotImplementedError


class SimulatedArm(BaseArm):
    """Software-simulated arm for development / demo without real hardware.

    Joint positions smoothly glide toward the latest target so the dashboard
    shows realistic motion. Safe defaults mirror the architecture doc.
    """

    def __init__(self, name: str, device: str, baudrate: int) -> None:
        super().__init__(name, device, baudrate)
        self._targets: List[float] = [0.0] * 6
        self._gripper_open = True
        self._home: List[float] = [0.0, -0.5, 0.5, 0.0, 0.0, 0.0]

    def connect(self) -> bool:
        # Simulate a brief serial handshake
        time.sleep(0.2)
        self._connected = True
        self._positions = list(self._home)
        self._targets = list(self._home)
        self._gripper_open = True
        return True

    def disconnect(self) -> bool:
        self._connected = False
        return True

    def get_positions(self) -> List[float]:
        return list(self._positions)

    def set_joint_target(self, index: int, position: float) -> None:
        if not self._connected:
            raise RuntimeError(f"{self.name} not connected")
        lo = settings.joint_position_min[index]
        hi = settings.joint_position_max[index]
        self._targets[index] = max(lo, min(hi, float(position)))
        if index == 5:
            self._gripper_open = self._targets[5] <= 0.5

    def set_joint_targets(self, positions: List[float]) -> None:
        if len(positions) != 6:
            raise ValueError("Expected 6 joint positions")
        for i, p in enumerate(positions):
            self.set_joint_target(i, p)

    def set_gripper(self, open_: bool) -> None:
        self._gripper_open = bool(open_)
        self.set_joint_target(5, 0.0 if open_ else 1.0)

    def stop(self) -> None:
        self._targets = list(self._positions)

    def emergency_stop(self) -> None:
        self.stop()

    def home(self) -> None:
        self.set_joint_targets(list(self._home))

    def calibrate(self) -> bool:
        time.sleep(0.4)
        self._positions = list(self._home)
        self._targets = list(self._home)
        self._gripper_open = True
        return True

    # Internal: advance the simulated physics one tick
    def tick(self, dt: float) -> None:
        max_speed = settings.max_speed_rad_per_sec
        for i in range(6):
            diff = self._targets[i] - self._positions[i]
            step = max_speed * dt
            if abs(diff) <= step:
                self._positions[i] = self._targets[i]
            else:
                self._positions[i] += step if diff > 0 else -step
