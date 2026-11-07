"""Vision API endpoints - object detection."""

from __future__ import annotations

from fastapi import APIRouter

from ai.object_detection import object_detector

router = APIRouter(tags=["vision"])


@router.get("/vision/detections", response_model=dict)
async def get_detections(camera: str = "environment"):
    detections = object_detector.detect(camera)
    return {"camera": camera, "detections": detections}


@router.post("/vision/detect", response_model=dict)
async def run_detection(camera: str = "environment"):
    detections = object_detector.detect(camera)
    return {"camera": camera, "detections": detections, "count": len(detections)}
