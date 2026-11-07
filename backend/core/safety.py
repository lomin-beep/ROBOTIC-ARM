"""SAEDGE Embodied AI Studio - safety layer.

Provides:
- Emergency-stop state
- Joint limit clamping
- Command arbitration (exclusive ownership of the follower arm)
- Software watchdog for stale commands

The safety manager is the gatekeeper: no command reaches the hardware without
passing through it.
"""

from __future__ import annotations

import time
from typing import List, Optional

from core.state_manager import robot_state
from core.config import settings


class SafetyError(Exception):
    """Raised when a command is rejected by the safety layer."""


class SafetyManager:
    def __init__(self) -> None:
        self.watchdog_timeout_sec: float = 2.0
        self._last_safe_command_ts: Optional[float] = None

    # ------------------------------------------------------------------ #
    # Emergency stop
    # ------------------------------------------------------------------ #
    def is_emergency_stop_active(self) -> bool:
        return bool(robot_state.emergency_stop)

    def trigger_emergency_stop(self, source: str = "software") -> None:
        robot_state.set_emergency_stop(True)
        robot_state.set_command_owner(None)

    def clear_emergency_stop(self) -> None:
        robot_state.set_emergency_stop(False)

    # ------------------------------------------------------------------ #
    # Joint limits
    # ------------------------------------------------------------------ #
    def clamp_position(self, index: int, value: float) -> float:
        mins = settings.joint_position_min
        maxs = settings.joint_position_max
        lo = mins[index] if index < len(mins) else -3.14
        hi = maxs[index] if index < len(maxs) else 3.14
        return max(lo, min(hi, float(value)))

    def validate_joint_targets(self, targets: List[float]) -> List[float]:
        if len(targets) != 6:
            raise SafetyError(f"Expected 6 joint targets, got {len(targets)}")
        clamped = [self.clamp_position(i, v) for i, v in enumerate(targets)]
        return clamped

    # ------------------------------------------------------------------ #
    # Command arbitration
    # ------------------------------------------------------------------ #
    def can_command(self, owner: str) -> bool:
        """Return True if `owner` may issue a motion command right now."""
        if robot_state.emergency_stop:
            return False
        current = robot_state.command_owner
        return current is None or current == owner

    def claim_ownership(self, owner: str) -> bool:
        if not self.can_command(owner):
            return False
        robot_state.set_command_owner(owner)
        self._last_safe_command_ts = time.time()
        return True

    def release_ownership(self, owner: str) -> None:
        if robot_state.command_owner == owner:
            robot_state.set_command_owner(None)

    # ------------------------------------------------------------------ #
    # Watchdog
    # ------------------------------------------------------------------ #
    def is_watchdog_tripped(self) -> bool:
        if self._last_safe_command_ts is None:
            return False
        return (time.time() - self._last_safe_command_ts) > self.watchdog_timeout_sec

    def check(self) -> Optional[SafetyError]:
        """Run a synchronous safety check. Returns an error if unsafe."""
        if robot_state.emergency_stop:
            return SafetyError("Emergency stop is active")
        if robot_state.command_owner is None:
            return SafetyError("No command owner claimed")
        if self.is_watchdog_tripped():
            return SafetyError("Command watchdog tripped - stale command")
        return None


# Module-level singleton
safety = SafetyManager()
