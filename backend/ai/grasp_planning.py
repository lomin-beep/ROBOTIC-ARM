"""Basic grasp planning - vision + calibrated workspace -> grasp pose.

Simulation-only placeholder. On the Jetson this combines camera-to-robot
calibration with object localization to produce a safe, bounded grasp target.
"""

from __future__ import annotations

from typing import Optional

from core.config import settings
from core.state_manager import robot_state


class GraspPlanner:
    def plan_grasp(self, object_label: str, camera: str = "environment") -> Optional[dict]:
        """Return a candidate grasp as joint targets, or None if not planable."""
        if robot_state.emergency_stop:
            return None
        positions = robot_state.snapshot()["joints"]
        current = [j["position"] for j in positions]
        # Demo grasp: move slightly from current home-ish pose
        grasp = list(current)
        grasp[0] = max(-3.0, min(3.0, current[0] + 0.3))
        grasp[1] = max(-1.5, min(1.5, current[1] - 0.2))
        grasp[2] = max(-1.5, min(1.5, current[2] + 0.2))
        grasp[5] = 0.0  # open
        return {
            "object": object_label,
            "camera": camera,
            "joint_targets": grasp,
            "approach": "top_down",
            "confidence": 0.8,
        }


# Module-level singleton
grasp_planner = GraspPlanner()
