import { useEffect, useState } from "react";
import { Bot, RefreshCw, Play, StopCircle } from "lucide-react";
import { robotApi } from "../services/api";
import { subscribeWs } from "../services/api";
import { ModeChip, EstopButton } from "../components";
import type { JointState } from "../types";

export default function TeleoperationStudio() {
  const [robot, setRobot] = useState<any>({
    mode: "stopped",
    emergency_stop: false,
    command_owner: null,
    gripper_open: true,
    leader_connected: false,
    follower_connected: false,
    joints: [] as JointState[],
  });

  useEffect(() => {
    robotApi.status().then(setRobot).catch(() => {});
    const unsub = subscribeWs("robot-status", (d: any) => setRobot(d));
    return unsub;
  }, []);

  const start = async () => {
    try {
      await robotApi.teleopStart();
    } catch {
      // ignore
    }
  };

  const stop = async () => {
    try {
      await robotApi.teleopStop();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Teleoperation Studio</h1>
          <p className="text-slate-400 text-sm">
            Leader-follower mirroring. The follower tracks the leader arm in
            real time for data collection.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={start}
            disabled={robot.mode === "teleoperation" || !!robot.emergency_stop}
            className="btn btn-success"
          >
            <Play size={16} className="mr-2" /> Start Teleoperation
          </button>
          <button
            onClick={stop}
            disabled={robot.mode !== "teleoperation" || !!robot.emergency_stop}
            className="btn btn-danger"
          >
            <StopCircle size={16} className="mr-2" /> Stop
          </button>
          <EstopButton
            active={!!robot.emergency_stop}
            onClear={() => robotApi.emergencyStopClear()}
            onTrigger={() => robotApi.emergencyStop()}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Leader Arm</h3>
          </div>
          <div className="panel p-4 border-slate-800/50">
            <p className="text-xs text-slate-400 mb-3">Move the leader arm manually; the follower mirrors.</p>
            <div className="space-y-3">
              {robot.joints.map((j: JointState) => (
                <div key={j.index} className="flex items-center gap-3">
                  <span className="w-16 text-[10px] text-slate-500">J{j.index + 1}</span>
                  <div className="flex-1 h-1 bg-slate-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-slate-400 rounded"
                      style={{ width: `50%` }}
                    />
                  </div>
                  <span className="w-16 text-[10px] font-mono text-slate-300 text-right">
                    {((j.position * 180) / Math.PI).toFixed(0)}°
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Follower Arm</h3>
          </div>
          <div className="panel p-4 border-slate-800/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400">Mirroring</span>
              <ModeChip mode={robot.mode} />
            </div>
            <div className="space-y-3">
              {robot.joints.map((j: JointState) => (
                <div key={j.index} className="flex items-center gap-3">
                  <span className="w-16 text-[10px] text-slate-500">J{j.index + 1}</span>
                  <div className="flex-1 h-1 bg-slate-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-saedge-accent rounded"
                      style={{ width: `50%` }}
                    />
                  </div>
                  <span className="w-16 text-[10px] font-mono text-slate-300 text-right">
                    {((j.position * 180) / Math.PI).toFixed(0)}°
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-200">Synchronization</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Leader connected</span>
            <span className={`text-xs font-bold ${robot.leader_connected ? "text-emerald-400" : "text-red-400"}`}>
              {robot.leader_connected ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Follower connected</span>
            <span className={`text-xs font-bold ${robot.follower_connected ? "text-emerald-400" : "text-red-400"}`}>
              {robot.follower_connected ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Command owner</span>
            <span className="text-xs font-mono text-slate-300">{robot.command_owner || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Emergency stop</span>
            <span className={`text-xs font-bold ${robot.emergency_stop ? "text-red-400" : "text-emerald-400"}`}>
              {robot.emergency_stop ? "ACTIVE" : "Clear"}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4">
          Teleoperation is arbitrated by the safety layer — only one source may
          command the follower arm at a time.
        </p>
      </div>
    </div>
  );
}
