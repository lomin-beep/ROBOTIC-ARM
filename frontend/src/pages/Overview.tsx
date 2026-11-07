import { useEffect, useState } from "react";
import {
  Activity,
  Bot,
  Camera,
  Cpu,
  Thermometer,
  HardDrive,
  ShieldAlert,
} from "lucide-react";
import { subscribeWs } from "../services/api";
import { systemApi, robotApi, camerasApi } from "../services/api";
import { StatusCard, ModeChip, EstopButton } from "../components";
import type { SystemMetrics } from "../types";

export default function Overview() {
  const [sys, setSys] = useState<any>({
    app: "SAEDGE Embodied AI Studio",
    version: "1.0.0",
    simulation: true,
    leader_connected: false,
    follower_connected: false,
    mode: "stopped",
    emergency_stop: false,
  });
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu_percent: 0,
    gpu_percent: 0,
    ram_percent: 0,
    storage_percent: 0,
    temperature_c: 0,
  });
  const [cameras, setCameras] = useState<any[]>([]);
  const [robot, setRobot] = useState<any>({
    leader_connected: false,
    follower_connected: false,
    mode: "stopped",
    calibrated: false,
    emergency_stop: false,
    command_owner: null,
    gripper_open: true,
  });

  useEffect(() => {
    systemApi.status().then(setSys).catch(() => {});
    robotApi.status().then(setRobot).catch(() => {});
    camerasApi.list().then(({ cameras: c }) => setCameras(c)).catch(() => {});
  }, []);

  useEffect(() => {
    const unsubSys = subscribeWs("system-monitor", (d: any) => setMetrics(d));
    const unsubRobot = subscribeWs("robot-status", (d: any) => setRobot(d));
    return () => {
      unsubSys();
      unsubRobot();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Overview</h1>
          <p className="text-slate-400 text-sm">System telemetry and robot status</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline">Export Logs</button>
          <EstopButton
            active={!!sys.emergency_stop || !!robot.emergency_stop}
            onClear={() => robotApi.emergencyStopClear()}
            onTrigger={() => robotApi.emergencyStop()}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="CPU Usage"
          value={`${metrics.cpu_percent.toFixed(0)}%`}
          sub="Jetson Orin Nano"
          status={metrics.cpu_percent > 85 ? "danger" : metrics.cpu_percent > 60 ? "warning" : "online"}
          icon={Cpu}
        />
        <StatusCard
          title="GPU Usage"
          value={`${metrics.gpu_percent.toFixed(0)}%`}
          sub="CUDA inference"
          status="online"
          icon={Activity}
        />
        <StatusCard
          title="RAM"
          value={`${metrics.ram_percent.toFixed(0)}%`}
          sub="8 GB shared"
          status={metrics.ram_percent > 85 ? "danger" : "online"}
        />
        <StatusCard
          title="Storage"
          value={`${metrics.storage_percent.toFixed(0)}%`}
          sub="Datasets + models"
          status="online"
          icon={HardDrive}
        />
        <StatusCard
          title="Temperature"
          value={`${metrics.temperature_c.toFixed(0)}°C`}
          sub="SoC"
          status={metrics.temperature_c > 80 ? "danger" : "online"}
          icon={Thermometer}
        />
        <StatusCard
          title="Leader Arm"
          value={sys.leader_connected ? "Connected" : "Disconnected"}
          sub={sys.simulation ? "Simulation" : "USB serial"}
          status={sys.leader_connected ? "online" : "offline"}
          icon={Bot}
        />
        <StatusCard
          title="Follower Arm"
          value={sys.follower_connected ? "Connected" : "Disconnected"}
          sub={sys.simulation ? "Simulation" : "USB serial"}
          status={sys.follower_connected ? "online" : "offline"}
          icon={Bot}
        />
        <StatusCard
          title="Cameras"
          value={`${cameras.filter((c) => c.connected).length}/${cameras.length}`}
          sub="Environment + Wrist"
          status={cameras.length === 2 && cameras.every((c) => c.connected) ? "online" : "warning"}
          icon={Camera}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel p-5 lg:col-span-2">
          <div className="panel-header">
            <h3 className="text-sm font-semibold text-slate-200">Robot Operating Mode</h3>
            <ModeChip mode={robot.mode} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="panel p-4">
              <p className="text-xs text-slate-500 mb-2">Follower Arm</p>
              <p className="text-sm text-slate-200">
                {robot.follower_connected ? "Online" : "Offline"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Calibrated: {robot.calibrated ? "Yes" : "No"}
              </p>
            </div>
            <div className="panel p-4">
              <p className="text-xs text-slate-500 mb-2">Command Owner</p>
              <p className="text-sm text-slate-200">
                {robot.command_owner || "—"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Gripper: {robot.gripper_open ? "Open" : "Closed"}
              </p>
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">Safety</h3>
            <ShieldAlert size={16} className="text-amber-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Emergency Stop</span>
              <span className={`text-xs font-bold ${
                (sys.emergency_stop || robot.emergency_stop) ? "text-red-400" : "text-emerald-400"
              }`}>
                {(sys.emergency_stop || robot.emergency_stop) ? "ACTIVE" : "ARMED"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Watchdog</span>
              <span className="text-xs text-emerald-400">OK</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Exclusive Ownership</span>
              <span className="text-xs text-emerald-400">Enabled</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Browser estop is software-only; a physical e-stop disconnects
            actuator power.
          </p>
        </div>
      </div>
    </div>
  );
}
