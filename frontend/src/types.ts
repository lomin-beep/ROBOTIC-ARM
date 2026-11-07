export type RobotMode =
  | "stopped"
  | "manual"
  | "teleoperation"
  | "ai_inference"
  | "recording";

export interface JointState {
  index: number;
  position: number;
  target: number;
  velocity: number;
  load: number;
  temperature: number;
  error: boolean;
}

export interface CameraInfo {
  name: string;
  index: number;
  connected: boolean;
  fps?: number;
  resolution?: string;
}

export interface SystemMetrics {
  cpu_percent: number;
  gpu_percent: number;
  ram_percent: number;
  storage_percent: number;
  temperature_c: number;
  ts?: number;
}

export interface RobotStatus {
  leader_connected: boolean;
  follower_connected: boolean;
  mode: RobotMode;
  calibrated: boolean;
  emergency_stop: boolean;
  command_owner: string | null;
  gripper_open: boolean;
  joints: JointState[];
}

export interface Detection {
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
}

export interface VisionResult {
  camera: string;
  detections: Detection[];
  ts?: number;
}

export interface Episode {
  id: string;
  file: string;
  path: string;
  steps: number;
  task: string;
}

export interface ApiError extends Error {
  status?: number;
}
