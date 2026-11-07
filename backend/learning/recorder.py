"""Episode recorder for demonstration data collection.

Uses the native LeRobot dataset format on the Jetson. In simulation it records
to a local JSONL file so the Dataset Studio page is functional.
"""

from __future__ import annotations

import json
import time
from typing import Optional

from core.state_manager import robot_state


class Recorder:
    def __init__(self) -> None:
        self.recording = False
        self.episode_id: Optional[str] = None
        self.task_description: str = ""
        self._path: Optional[str] = None
        self._file = None

    def start(self, task_description: str, datasets_dir: str = "datasets") -> str:
        self.recording = True
        self.task_description = task_description
        ts = time.strftime("%Y%m%d_%H%M%S")
        self.episode_id = f"episode_{ts}"
        import os

        os.makedirs(datasets_dir, exist_ok=True)
        self._path = os.path.join(datasets_dir, f"{self.episode_id}.jsonl")
        self._file = open(self._path, "w", encoding="utf-8")
        return self.episode_id

    def step(self, observations: dict, action: list[float]) -> None:
        if not self.recording or self._file is None:
            return
        record = {
            "ts": time.time(),
            "task": self.task_description,
            "observations": observations,
            "action": action,
            "mode": robot_state.mode,
        }
        self._file.write(json.dumps(record) + "\n")

    def stop(self) -> Optional[str]:
        self.recording = False
        if self._file is not None:
            self._file.close()
            self._file = None
        ep = self.episode_id
        self.episode_id = None
        return ep


recorder = Recorder()
