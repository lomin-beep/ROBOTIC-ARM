"""SAEDGE Embodied AI Studio - configuration.

Loads settings from environment variables with sensible defaults. Designed to
run both in simulation mode (development / CI / non-Jetson machines) and on the
Jetson Orin Nano Super with real SO-ARM101 hardware.
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ------------------------------------------------------------------ #
    # Application
    # ------------------------------------------------------------------ #
    app_name: str = "SAEDGE Embodied AI Studio"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, env="SAEDGE_DEBUG")
    simulation: bool = Field(
        default=True,
        env="SAEDGE_SIMULATION",
        description="When True, run with simulated hardware so the stack can be "
        "developed and demoed without a Jetson / SO-ARM101 attached.",
    )

    # ------------------------------------------------------------------ #
    # Network
    # ------------------------------------------------------------------ #
    host: str = Field(default="0.0.0.0", env="SAEDGE_HOST")
    port: int = Field(default=8000, env="SAEDGE_PORT")
    cors_origins: List[str] = Field(default=["*"], env="SAEDGE_CORS_ORIGINS")

    # ------------------------------------------------------------------ #
    # Hardware - serial device naming (udev rules on Jetson)
    # ------------------------------------------------------------------ #
    leader_device: str = Field(default="/dev/so101_leader", env="SAEDGE_LEADER_DEVICE")
    follower_device: str = Field(
        default="/dev/so101_follower", env="SAEDGE_FOLLOWER_DEVICE"
    )
    leader_baudrate: int = Field(default=1000000, env="SAEDGE_LEADER_BAUDRATE")
    follower_baudrate: int = Field(default=1000000, env="SAEDGE_FOLLOWER_BAUDRATE")

    # ------------------------------------------------------------------ #
    # Cameras
    # ------------------------------------------------------------------ #
    environment_camera_index: int = Field(default=0, env="SAEDGE_ENV_CAMERA_INDEX")
    wrist_camera_index: int = Field(default=2, env="SAEDGE_WRIST_CAMERA_INDEX")
    camera_width: int = Field(default=640, env="SAEDGE_CAMERA_WIDTH")
    camera_height: int = Field(default=480, env="SAEDGE_CAMERA_HEIGHT")
    camera_fps: int = Field(default=15, env="SAEDGE_CAMERA_FPS")

    # ------------------------------------------------------------------ #
    # Safety / motion limits (SO-ARM101 calibrated ranges are used on Jetson)
    # ------------------------------------------------------------------ #
    # Six joints: J1..J6 (J6 = gripper). Radians by default.
    joint_position_min: List[float] = Field(
        default=[-3.14, -1.57, -1.57, -1.57, -1.57, 0.0], env="SAEDGE_JOINT_MIN"
    )
    joint_position_max: List[float] = Field(
        default=[3.14, 1.57, 1.57, 1.57, 1.57, 1.0], env="SAEDGE_JOINT_MAX"
    )
    max_speed_rad_per_sec: float = Field(default=1.0, env="SAEDGE_MAX_SPEED")
    max_accel_rad_per_sec2: float = Field(default=2.0, env="SAEDGE_MAX_ACCEL")

    # ------------------------------------------------------------------ #
    # AI
    # ------------------------------------------------------------------ #
    inference_device: str = Field(default="cpu", env="SAEDGE_INFERENCE_DEVICE")
    detection_confidence_threshold: float = Field(
        default=0.5, env="SAEDGE_DETECTION_THRESHOLD"
    )
    training_enabled: bool = Field(default=False, env="SAEDGE_TRAINING_ENABLED")

    # ------------------------------------------------------------------ #
    # Data
    # ------------------------------------------------------------------ #
    datasets_dir: str = Field(default="datasets", env="SAEDGE_DATASETS_DIR")
    models_dir: str = Field(default="models", env="SAEDGE_MODELS_DIR")
    calibration_dir: str = Field(default="calibration", env="SAEDGE_CALIBRATION_DIR")
    logs_dir: str = Field(default="logs", env="SAEDGE_LOGS_DIR")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
