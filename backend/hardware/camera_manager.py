"""Camera manager.

Produces simulated camera frames / status for development. On the Jetson, swap
the implementation for real OpenCV VideoCapture on /dev/video0 and /dev/video2.
"""

from __future__ import annotations

import base64
import io
import logging
import time

from core.config import settings
from core.state_manager import robot_state

logger = logging.getLogger("saedge.camera")

try:  # Pillow is optional in simulation; used to render a demo frame
    from PIL import Image, ImageDraw

    _HAS_PIL = True
except Exception:  # pragma: no cover - environment dependent
    _HAS_PIL = False


class CameraManager:
    def __init__(self) -> None:
        self._cameras = {
            "environment": {
                "index": settings.environment_camera_index,
                "name": "Environment camera",
                "connected": False,
            },
            "wrist": {
                "index": settings.wrist_camera_index,
                "name": "Wrist camera",
                "connected": False,
            },
        }

    def start(self) -> dict:
        results = {}
        for name, cam in self._cameras.items():
            # Simulated cameras always "connect"
            cam["connected"] = True
            cam["fps"] = float(settings.camera_fps)
            cam["last_frame_ts"] = time.time()
            robot_state.set_camera_connected(name, True, cam["fps"])
            results[name] = {
                "index": cam["index"],
                "name": cam["name"],
                "connected": True,
                "fps": cam["fps"],
                "resolution": f"{settings.camera_width}x{settings.camera_height}",
            }
        return results

    def stop(self) -> None:
        for name, cam in self._cameras.items():
            cam["connected"] = False
            robot_state.set_camera_connected(name, False)

    def get_frame(self, name: str) -> Optional[str]:
        """Return a base64 JPEG data URI for the requested camera, or None."""
        cam = self._cameras.get(name)
        if not cam or not cam["connected"]:
            return None
        robot_state.update_camera_frame(name)
        return self._demo_frame(name)

    def list_cameras(self) -> list[dict]:
        return [
            {
                "name": name,
                "index": cam["index"],
                "connected": cam["connected"],
                "fps": cam.get("fps", 0),
            }
            for name, cam in self._cameras.items()
        ]

    # ------------------------------------------------------------------ #
    # Demo frame generation (purely for standalone demonstration)
    # ------------------------------------------------------------------ #
    def _demo_frame(self, name: str) -> str:
        if not _HAS_PIL:
            return ""
        width = settings.camera_width
        height = settings.camera_height
        img = Image.new("RGB", (width, height), color=(20, 24, 32))
        draw = ImageDraw.Draw(img)
        # Crosshair
        cx, cy = width // 2, height // 2
        draw.line([(cx - 80, cy), (cx + 80, cy)], fill=(0, 150, 255), width=3)
        draw.line([(cx, cy - 80), (cx, cy + 80)], fill=(0, 150, 255), width=3)
        # Label
        label = name.upper()
        draw.text((30, 30), label, fill=(200, 200, 200))
        # Moving object to simulate activity
        t = time.time() % 5.0
        ox = int(cx + 120 * __import__("math").sin(t * 1.5))
        oy = int(cy + 60 * __import__("math").cos(t))
        draw.ellipse(
            [ox - 24, oy - 24, ox + 24, oy + 24],
            fill=(255, 80, 80),
            outline=(255, 200, 200),
            width=3,
        )
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=70)
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")
        return f"data:image/jpeg;base64,{b64}"


# Module-level singleton
camera_manager = CameraManager()
