"""Object detection - simulated for standalone demo.

On the Jetson this wraps a YOLO-small model running via TensorRT / PyTorch and
returns real bounding boxes from the camera streams.
"""

from __future__ import annotations

import random
import time
from typing import List

from core.config import settings


class Detection:
    def __init__(self, label: str, confidence: float, bbox: List[float]):
        self.label = label
        self.confidence = confidence
        # bbox: [x1, y1, x2, y2] in pixels
        self.bbox = bbox

    def to_dict(self) -> dict:
        return {
            "label": self.label,
            "confidence": round(self.confidence, 3),
            "bbox": self.bbox,
        }


class ObjectDetector:
    COCO_LABELS = [
        "block", "cup", "bottle", "bowl", "box", "person", "remote",
        "keyboard", "mouse", "scissors",
    ]

    def __init__(self) -> None:
        self.confidence_threshold = settings.detection_confidence_threshold
        self._rng = random.Random(42)

    def detect(self, camera: str = "environment") -> List[dict]:
        """Return a list of detections for the given camera.

        In simulation this returns a small, jittering set of demo detections so
        the Vision Studio page is functional without a model or camera.
        """
        now = time.time()
        detections: List[dict] = []
        n = self._rng.randint(1, 3)
        width = settings.camera_width
        height = settings.camera_height
        for _ in range(n):
            label = self._rng.choice(self.COCO_LABELS)
            conf = round(self._rng.uniform(0.55, 0.95), 3)
            if conf < self.confidence_threshold:
                continue
            x = self._rng.uniform(0.15, 0.75) * width
            y = self._rng.uniform(0.15, 0.75) * height
            w = self._rng.uniform(0.08, 0.25) * width
            h = self._rng.uniform(0.08, 0.25) * height
            detections.append(
                Detection(label, conf, [x, y, x + w, y + h]).to_dict()
            )
        detections.sort(key=lambda d: d["confidence"], reverse=True)
        return detections

    def detect_frame(self, frame_b64: str, camera: str = "environment") -> List[dict]:
        return self.detect(camera)


# Module-level singleton
object_detector = ObjectDetector()
