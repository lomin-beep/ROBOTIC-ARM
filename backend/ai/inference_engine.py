"""Inference engine - coordinates vision + policy for autonomous tasks."""

from __future__ import annotations

from typing import Optional

from ai.act_policy import act_policy
from ai.object_detection import object_detector
from core.state_manager import robot_state


class InferenceEngine:
    def __init__(self) -> None:
        self.running = False

    def run_detection(self, camera: str = "environment") -> list[dict]:
        return object_detector.detect(camera)

    def run_policy(self, observations: dict) -> Optional[list[float]]:
        if not act_policy.is_loaded():
            return None
        return act_policy.predict(observations)


inference_engine = InferenceEngine()
