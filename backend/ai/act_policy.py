"""ACT (Action Chunking with Transformers) policy wrapper.

LeRobot integration point. In simulation this returns a repeating chunk of
demonstration-like actions. On the Jetson this loads a trained ACT checkpoint
and performs real inference.
"""

from __future__ import annotations

from typing import List

from core.config import settings


class ACTPolicy:
    def __init__(self) -> None:
        self.checkpoint: Optional[str] = None
        self.loaded = False

    def load(self, checkpoint_path: str) -> bool:
        self.checkpoint = checkpoint_path
        # Real implementation: load via LeRobot / torch
        self.loaded = True
        return True

    def predict(self, observations: dict) -> List[float]:
        """Return a 6-element action (joint targets)."""
        # Simulation: small sinusoidal demo action
        import math
        import time

        t = time.time()
        return [
            0.2 * math.sin(t),
            -0.5 + 0.1 * math.cos(t),
            0.5 + 0.1 * math.sin(t),
            0.0,
            0.0,
            0.0,  # gripper open
        ]

    def is_loaded(self) -> bool:
        return self.loaded


act_policy = ACTPolicy()
