# SAEDGE Embodied AI Studio

A complete, locally operated robotics and embodied AI research platform built
around the **Hiwonder SO-ARM101** (leader + follower) and the **NVIDIA Jetson
Orin Nano Super** running JetPack 6.2.1.

The stack runs entirely on the Jetson — no cloud APIs or external GPU servers
are required for normal operation. A browser-based React dashboard talks to a
FastAPI backend over REST + WebSockets.

> **Architecture:** this repository contains the full studio — backend (FastAPI
> + hardware abstraction + AI + learning modules) and frontend (React +
> TypeScript + Tailwind dashboard with 8 pages). It runs in **simulation mode**
> by default so it can be developed and demonstrated without physical hardware.
> Set `SAEDGE_SIMULATION=false` and connect the SO-ARM101 to operate on the
> Jetson.

```
saedge-embodied-ai-studio/
├── backend/                 # FastAPI backend
│   ├── main.py              # App, lifespan, background loops, WebSockets
│   ├── api/                 # REST routers (robot, cameras, vision, tasks, datasets, models)
│   ├── core/                # config, state_manager, safety, event_manager
│   ├── hardware/            # so101_leader, so101_follower, servo_manager, camera_manager
│   ├── ai/                  # object_detection, grasp_planning, act_policy, inference_engine
│   ├── learning/            # recorder, dataset_manager, trainer, evaluator
│   └── requirements.txt
├── frontend/                # React + TypeScript + Tailwind dashboard
│   ├── src/components/      # Layout, StatusCard, CameraFeed, JointControl, …
│   ├── src/pages/           # 8 dashboard pages
│   └── src/services/api.ts  # REST + WebSocket client
├── datasets/                # Recorded episodes (LeRobot JSONL format)
├── models/                  # Trained checkpoints (ACT, vision)
├── calibration/             # Robot + camera calibration files
├── logs/                    # Runtime logs
├── scripts/                 # start.sh / stop.sh
├── config/                  # lerobot.yaml
├── config/                  # lerobot.yaml
├── docker-compose.yml       # Backend + frontend services
├── Dockerfile               # Backend image
├── .env.example             # Environment configuration
└── README.md
```

## Dashboard pages

| Page | Purpose |
|------|---------|
| Overview | Jetson CPU/GPU/RAM/storage/temp, robot & camera connection, mode, safety |
| Robot Control | Joint sliders, numeric input, home, calibrate, gripper, stop, estop |
| Vision Studio | Environment + wrist camera feeds, object detection, target selection |
| AI Task Studio | Structured instruction → verified plan → bounded robot actions |
| Teleoperation Studio | Leader → follower mirroring, sync monitoring |
| Dataset Studio | Episode recording in LeRobot format, episode list |
| Model Studio | ACT checkpoint management, inference testing |
| Settings & Safety | Joint limits, cameras, USB devices, estop status, permissions |

## Quick start (local development, simulation mode)

```bash
# 1. Clone / open this repository
cd /home/user/test3

# 2. Start backend + frontend
chmod +x scripts/start.sh
./scripts/start.sh

# 3. Open the dashboard
open http://localhost:5173

# Backend API docs: http://localhost:8000/docs
```

The backend starts in simulation mode — leader/follower arms and cameras are
simulated, so the dashboard is fully functional for demonstration and UI
development without a Jetson or SO-ARM101 attached.

## Docker

```bash
docker compose up --build
# Dashboard: http://localhost:5173
# API: http://localhost:8000
```

## Running on the Jetson Orin Nano Super (JetPack 6.2.1)

1. Flash JetPack 6.2.1 (Ubuntu 22.04) on the Orin Nano Super.
2. Install the NVIDIA CUDA / PyTorch / OpenCV stack provided by JetPack.
3. Install LeRobot: `pip install lerobot` (validate against the JetPack CUDA).
4. Connect the leader and follower BusLinker boards via USB serial, and both
   USB cameras. Create persistent udev rules:
   ```
   /dev/so101_leader   -> Leader BusLinker
   /dev/so101_follower -> Follower BusLinker
   /dev/video0         -> Environment camera
   /dev/video2         -> Wrist camera
   ```
5. Copy `.env.example` to `.env` and set:
   ```
   SAEDGE_SIMULATION=false
   SAEDGE_INFERENCE_DEVICE=cuda
   ```
6. Run: `python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000`
   (or `docker compose up --build` on the Jetson).

Real hardware support is implemented by replacing the simulated classes in
`backend/hardware/` with the LeRobot SO-ARM101 driver and OpenCV
`VideoCapture`. The API surface stays the same.

## API reference

### System
- `GET /api/health` — health
- `GET /api/system/status` — app + robot + connection status

### Robot
- `GET /api/robot/status`
- `POST /api/robot/connect` — connect leader + follower
- `POST /api/robot/disconnect`
- `POST /api/robot/calibrate`
- `POST /api/robot/home`
- `POST /api/robot/joint` `{index, position, owner}`
- `POST /api/robot/joints` `{positions, owner}`
- `POST /api/robot/gripper` `{open, owner}`
- `POST /api/robot/teleoperation/start`
- `POST /api/robot/teleoperation/stop`
- `POST /api/robot/stop` `{owner?}`
- `POST /api/robot/emergency-stop`
- `POST /api/robot/emergency-stop/clear`

### Cameras
- `GET /api/cameras`
- `POST /api/cameras/start`, `POST /api/cameras/stop`
- `GET /api/cameras/{name}/frame`

### Vision
- `GET /api/vision/detections?camera=environment`
- `POST /api/vision/detect?camera=environment`

### Tasks
- `POST /api/tasks/execute?instruction=...`

### Datasets
- `POST /api/datasets/record?task_description=...`
- `POST /api/datasets/stop`
- `GET /api/datasets/episodes`

### Models
- `POST /api/models/infer?checkpoint=...`
- `POST /api/models/load?checkpoint=...`
- `GET /api/models/status`

### WebSocket
- `WS /ws/{channel}` — channels: `robot-status`, `joint-states`,
  `camera-events`, `vision-results`, `task-progress`, `system-monitor`

## Safety

- Emergency stop (software via dashboard, plus a **physical e-stop** that
  disconnects follower actuator power — the browser estop is not a substitute).
- Exclusive command ownership: only one of manual / teleoperation / AI may
  command the follower arm at a time.
- Joint limits and speed limits clamp every motion command.
- A stale-command watchdog stops motion if commands stop arriving.
- Training is disabled while autonomous robot operation is active.

## AI strategy (Orin Nano, 8 GB shared memory)

1. **Level 1 — Computer vision:** YOLO-small object detection + OpenCV (10+ FPS
   target at 640×480).
2. **Level 2 — Imitation learning:** ACT via LeRobot — collect demonstrations,
   train locally, run policy inference on the follower.
3. **Level 3 — VLA (experimental):** SmolVLA / OpenVLA — benchmark only.
4. **Level 4 — Language → actions:** structured task planner that translates
   instructions into bounded, safety-checked robot commands. A language model
   never generates unrestricted servo commands.

## Data

Demonstrations are stored in the native LeRobot dataset format
(synchronized video + robot state + action). Recording produces JSONL episodes
under `datasets/` during development.

## Repository status

This branch implements the full studio in simulation mode with a working
FastAPI backend and React dashboard. All API endpoints and WebSocket channels
are implemented and were exercised end-to-end.
