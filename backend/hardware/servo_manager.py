"""High-level servo / arm manager.

Owns the leader and follower arms and coordinates connection, calibration and
motion commands. This is the single hardware-facing entry point used by the API
routers.
"""

from __future__ import annotations

import logging
from typing import List, Optional

from core.config import settings
from core.safety import safety
from core.state_manager import robot_state
from hardware.so101_follower import So101Follower
from hardware.so101_leader import So101Leader

logger = logging.getLogger("saedge.servo")


class ServoManager:
    def __init__(self) -> None:
        self.leader = So101Leader()
        self.follower = So101Follower()
        self._calibrated = False

    # ------------------------------------------------------------------ #
    # Connection
    # ------------------------------------------------------------------ #
    def connect(self) -> dict:
        leader_ok = self.leader.connect()
        follower_ok = self.follower.connect()
        robot_state.set_connection(leader_ok, follower_ok)
        return {
            "leader_connected": leader_ok,
            "follower_connected": follower_ok,
            "simulation": settings.simulation,
        }

    def disconnect(self) -> None:
        self.follower.stop()
        self.leader.stop()
        self.follower.disconnect()
        self.leader.disconnect()
        robot_state.set_connection(False, False)
        safety.release_ownership("teleoperation")
        safety.release_ownership("ai")
        safety.release_ownership("manual")

    # ------------------------------------------------------------------ #
    # Calibration / home
    # ------------------------------------------------------------------ #
    def calibrate(self) -> dict:
        ok_leader = self.leader.calibrate()
        ok_follower = self.follower.calibrate()
        self._calibrated = ok_leader and ok_follower
        positions = self.follower.get_positions()
        for i, p in enumerate(positions):
            robot_state.set_joint_position(i, p)
        robot_state.set_gripper(True)
        return {
            "calibrated": self._calibrated,
            "leader": ok_leader,
            "follower": ok_follower,
            "positions": positions,
        }

    def home(self) -> dict:
        if not self.follower.is_connected():
            raise RuntimeError("Follower not connected")
        self.follower.home()
        positions = self.follower.get_positions()
        for i, p in enumerate(positions):
            robot_state.set_joint_position(i, p)
        robot_state.set_gripper(True)
        return {"positions": positions}

    # ------------------------------------------------------------------ #
    # Motion
    # ------------------------------------------------------------------ #
    def set_follower_joint(self, index: int, position: float, owner: str) -> dict:
        if not safety.can_command(owner):
            raise PermissionError(
                f"Follower arm is owned by {robot_state.command_owner}; "
                f"'{owner}' cannot command it"
            )
        safety.claim_ownership(owner)
        clamped = safety.clamp_position(index, position)
        self.follower.set_joint_target(index, clamped)
        robot_state.set_joint_target(index, clamped)
        return {"index": index, "position": clamped}

    def set_follower_joints(
        self, positions: List[float], owner: str
    ) -> dict:
        if not safety.can_command(owner):
            raise PermissionError(
                f"Follower arm is owned by {robot_state.command_owner}; "
                f"'{owner}' cannot command it"
            )
        safety.claim_ownership(owner)
        clamped = safety.validate_joint_targets(positions)
        self.follower.set_joint_targets(clamped)
        for i, p in enumerate(clamped):
            robot_state.set_joint_target(i, p)
        return {"positions": clamped}

    def set_gripper(self, open_: bool, owner: str) -> dict:
        if not safety.can_command(owner):
            raise PermissionError(
                f"Follower arm is owned by {robot_state.command_owner}"
            )
        safety.claim_ownership(owner)
        self.follower.set_gripper(open_)
        robot_state.set_gripper(open_)
        return {"gripper_open": open_}

    def stop(self, owner: Optional[str] = None) -> dict:
        self.follower.stop()
        self.leader.stop()
        if owner:
            safety.release_ownership(owner)
        robot_state.set_command_owner(None)
        robot_state.set_mode("stopped")
        positions = self.follower.get_positions()
        for i, p in enumerate(positions):
            robot_state.set_joint_position(i, p)
        return {"stopped": True}

    def emergency_stop(self) -> dict:
        safety.trigger_emergency_stop("software")
        self.follower.emergency_stop()
        self.leader.emergency_stop()
        robot_state.set_command_owner(None)
        robot_state.set_mode("stopped")
        return {"emergency_stop": True}

    def clear_emergency_stop(self) -> dict:
        safety.clear_emergency_stop()
        return {"cleared": True}

    # ------------------------------------------------------------------ #
    # Teleoperation (leader -> follower mirroring)
    # ------------------------------------------------------------------ #
    def start_teleoperation(self) -> dict:
        if not self.follower.is_connected() or not self.leader.is_connected():
            raise RuntimeError("Both arms must be connected")
        safety.claim_ownership("teleoperation")
        robot_state.set_mode("teleoperation")
        return {"teleoperation": True}

    def stop_teleoperation(self) -> dict:
        safety.release_ownership("teleoperation")
        robot_state.set_mode("stopped")
        self.follower.stop()
        return {"teleoperation": False}

    def tick_teleoperation(self) -> None:
        """Mirror leader joints to follower. Called by the background loop."""
        if robot_state.command_owner != "teleoperation":
            return
        leader_positions = self.leader.get_positions()
        self.follower.set_joint_targets(leader_positions)
        for i, p in enumerate(leader_positions):
            robot_state.set_joint_target(i, p)
            robot_state.set_joint_position(i, p)

    def is_calibrated(self) -> bool:
        return self._calibrated


# Module-level singleton
servo_manager = ServoManager()
