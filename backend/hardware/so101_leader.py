"""SO-ARM101 leader arm (the human-operated master)."""

from __future__ import annotations

from core.config import settings
from hardware.base_arm import BaseArm, SimulatedArm


class So101Leader(BaseArm):
    def __init__(self) -> None:
        if settings.simulation:
            self._impl = SimulatedArm(
                "leader", settings.leader_device, settings.leader_baudrate
            )
        else:
            # Real hardware implementation goes here (LeRobot SO-ARM101 driver)
            self._impl = SimulatedArm(
                "leader", settings.leader_device, settings.leader_baudrate
            )

    def connect(self) -> bool:
        return self._impl.connect()

    def disconnect(self) -> bool:
        return self._impl.disconnect()

    def is_connected(self) -> bool:
        return self._impl.is_connected()

    def get_positions(self) -> list[float]:
        return self._impl.get_positions()

    def set_joint_target(self, index: int, position: float) -> None:
        self._impl.set_joint_target(index, position)

    def set_joint_targets(self, positions: list[float]) -> None:
        self._impl.set_joint_targets(positions)

    def set_gripper(self, open_: bool) -> None:
        self._impl.set_gripper(open_)

    def stop(self) -> None:
        self._impl.stop()

    def emergency_stop(self) -> None:
        self._impl.emergency_stop()

    def home(self) -> None:
        self._impl.home()

    def calibrate(self) -> bool:
        return self._impl.calibrate()


# Backwards-compatible alias expected by some modules
SO101Leader = So101Leader
