"""ACT trainer placeholder.

On the Jetson this launches LeRobot ACT training. Training is gated behind
SAEDGE_TRAINING_ENABLED and must be disabled while autonomous robot operation
is active (see architecture doc, section 7).
"""

from __future__ import annotations

from core.config import settings


class Trainer:
    def __init__(self) -> None:
        self.training = False

    def start(self, dataset_id: str, config: dict) -> dict:
        if not settings.training_enabled:
            return {
                "started": False,
                "reason": "Training disabled (SAEDGE_TRAINING_ENABLED=false)",
            }
        self.training = True
        return {
            "started": True,
            "dataset": dataset_id,
            "config": config,
            "note": "Simulation mode - no real training performed",
        }

    def stop(self) -> dict:
        self.training = False
        return {"stopped": True}

    def status(self) -> dict:
        return {"training": self.training}


trainer = Trainer()
