"""Dataset manager - lists and inspects recorded episodes."""

from __future__ import annotations

import json
import os
from typing import List


class DatasetManager:
    def __init__(self, datasets_dir: str = "datasets") -> None:
        self.datasets_dir = datasets_dir

    def list_episodes(self) -> List[dict]:
        if not os.path.isdir(self.datasets_dir):
            return []
        episodes = []
        for fname in sorted(os.listdir(self.datasets_dir)):
            if fname.endswith(".jsonl"):
                fpath = os.path.join(self.datasets_dir, fname)
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        lines = f.readlines()
                    task = ""
                    for line in lines:
                        try:
                            rec = json.loads(line)
                            task = rec.get("task", "")
                            break
                        except Exception:
                            continue
                except Exception:
                    lines = []
                    task = ""
                episodes.append(
                    {
                        "id": fname.replace(".jsonl", ""),
                        "file": fname,
                        "path": fpath,
                        "steps": len(lines),
                        "task": task,
                    }
                )
        return episodes


# Module-level singleton
dataset_manager = DatasetManager()
