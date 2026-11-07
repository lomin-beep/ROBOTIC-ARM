/**
 * SAEDGE API service layer.
 *
 * REST calls go to relative /api (proxied by Vite in dev, served by the same
 * origin in production). WebSocket telemetry connects to /ws/{channel}.
 */

import type {
  CameraInfo,
  Detection,
  Episode,
  RobotStatus,
} from "../types";

const BASE = "/api";

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${input}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const err: Error & { status?: number } = new Error(
      `${res.status} ${res.statusText} for ${input}`
    );
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) {
    return null as unknown as T;
  }
  return (await res.json()) as T;
}

export const robotApi = {
  status: () => request<RobotStatus>("/robot/status"),
  connect: () =>
    request<{
      leader_connected: boolean;
      follower_connected: boolean;
      simulation: boolean;
    }>("/robot/connect", { method: "POST" }),
  disconnect: () => request("/robot/disconnect", { method: "POST" }),
  calibrate: () => request("/robot/calibrate", { method: "POST" }),
  home: () => request<{ positions: number[] }>("/robot/home", { method: "POST" }),
  joint: (index: number, position: number, owner: string) =>
    request("/robot/joint", {
      method: "POST",
      body: JSON.stringify({ index, position, owner }),
    }),
  joints: (positions: number[], owner: string) =>
    request("/robot/joints", {
      method: "POST",
      body: JSON.stringify({ positions, owner }),
    }),
  gripper: (open: boolean, owner: string) =>
    request("/robot/gripper", {
      method: "POST",
      body: JSON.stringify({ open, owner }),
    }),
  teleopStart: () => request("/robot/teleoperation/start", { method: "POST" }),
  teleopStop: () => request("/robot/teleoperation/stop", { method: "POST" }),
  stop: (owner?: string) =>
    request("/robot/stop", {
      method: "POST",
      body: JSON.stringify({ owner }),
    }),
  emergencyStop: () => request("/robot/emergency-stop", { method: "POST" }),
  emergencyStopClear: () =>
    request("/robot/emergency-stop/clear", { method: "POST" }),
};

export const camerasApi = {
  list: () => request<{ cameras: CameraInfo[] }>("/cameras"),
  start: () => request("/cameras/start", { method: "POST" }),
  stop: () => request("/cameras/stop", { method: "POST" }),
  frame: (name: string) =>
    request<{
      camera: string;
      connected: boolean;
      frame: string | null;
      ts: number;
    }>(`/cameras/${encodeURIComponent(name)}/frame`),
};

export const visionApi = {
  detections: (camera = "environment") =>
    request<{ camera: string; detections: Detection[] }>(
      `/vision/detections?camera=${encodeURIComponent(camera)}`
    ),
  run: (camera = "environment") =>
    request<{ camera: string; detections: Detection[]; count: number }>(
      `/vision/detect?camera=${encodeURIComponent(camera)}`,
      { method: "POST" }
    ),
};

export const tasksApi = {
  execute: (instruction: string) =>
    request(
      `/tasks/execute?instruction=${encodeURIComponent(instruction)}`,
      { method: "POST" }
    ),
};

export const datasetsApi = {
  record: (taskDescription = "untitled_task") =>
    request<{ recording: boolean; episode_id: string }>(
      `/datasets/record?task_description=${encodeURIComponent(taskDescription)}`,
      { method: "POST" }
    ),
  stop: () =>
    request<{ recording: boolean; episode_id: string | null }>(
      "/datasets/stop",
      { method: "POST" }
    ),
  episodes: () => request<{ episodes: Episode[] }>("/datasets/episodes"),
};

export const modelsApi = {
  infer: (checkpoint = "default") =>
    request<{ checkpoint: string; action: number[] }>(
      `/models/infer?checkpoint=${encodeURIComponent(checkpoint)}`,
      { method: "POST" }
    ),
  load: (checkpoint: string) =>
    request<{ loaded: boolean; checkpoint: string }>(
      `/models/load?checkpoint=${encodeURIComponent(checkpoint)}`,
      { method: "POST" }
    ),
  status: () =>
    request<{ loaded: boolean; checkpoint: string | null }>("/models/status"),
};

export const systemApi = {
  status: () =>
    request<{
      app: string;
      version: string;
      simulation: boolean;
      leader_connected: boolean;
      follower_connected: boolean;
      mode: string;
      emergency_stop: boolean;
    }>("/system/status"),
};

// ---------------------------------------------------------------------- #
// WebSocket client
// ---------------------------------------------------------------------- #
type WsHandler = (data: unknown) => void;

class WsClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers = new Map<string, Set<WsHandler>>();
  private reconnectTimer: number | null = null;

  constructor(channel: string) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    this.url = `${protocol}//${host}/ws/${channel}`;
    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => {
        this.handlers.forEach((set) =>
          set.forEach((h) => h({ type: "connected" }))
        );
      };
      this.ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          const ch = this.url.split("/ws/")[1];
          const set = this.handlers.get(ch);
          set?.forEach((h) => h(data));
        } catch {
          // ignore malformed messages
        }
      };
      this.ws.onclose = () => {
        this.ws = null;
        this.scheduleReconnect();
      };
      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  subscribe(channel: string, handler: WsHandler) {
    if (!this.handlers.has(channel)) this.handlers.set(channel, new Set());
    this.handlers.get(channel)!.add(handler);
    return () => {
      this.handlers.get(channel)?.delete(handler);
    };
  }

  close() {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
  }
}

const wsClients = new Map<string, WsClient>();

export function subscribeWs(channel: string, handler: WsHandler) {
  if (!wsClients.has(channel)) {
    wsClients.set(channel, new WsClient(channel));
  }
  return wsClients.get(channel)!.subscribe(channel, handler);
}

export function closeAllWs() {
  wsClients.forEach((c) => c.close());
  wsClients.clear();
}
