import { useEffect, useState } from "react";
import { Bot, StopCircle, Hand } from "lucide-react";
import { robotApi } from "../services/api";
import { ModeChip, EstopButton } from "../components";
import type { JointState } from "../types";

const JOINTS = [
  { index: 0, label: "Shoulder Pan", unit: "rad" },
  { index: 1, label: "Shoulder Lift", unit: "rad" },
  { index: 2, label: "Elbow Flex", unit: "rad" },
  { index: 3, label: "Wrist Flex", unit: "rad" },
  { index: 4, label: "Wrist Roll", unit: "rad" },
  { index: 5, label: "Gripper", unit: "rad" },
];

export default function RobotControl() {
  const [robot, setRobot] = useState<any>({
    leader_connected: false,
    follower_connected: false,
    mode: "stopped",
    calibrated: false,
    emergency_stop: false,
    command_owner: null,
    gripper_open: true,
    joints: [] as JointState[],
  });
  const [connected, setConnected] = useState(false);
  const [calibrated, setCalibrated] = useState(false);

  useEffect(() => {
    robotApi.status().then(setRobot).catch(() => {});
    const unsub = (() => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {};
    })();
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = (() => {
      const es = new EventSource("/api/system/status");
      return () => es.close();
    })();
    return unsub;
  }, []);

  // Poll status (simple approach; WebSocket also available)
  const timer = setInterval(() => {
    robotApi.status().then(setRobot).catch(() => {});
  }, 1000);
  return (
    <>
      {timer && null}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Robot Control</h1>
            <p className="text-slate-400 text-sm">
              Joint-level control of the follower arm. All commands pass through
              the backend safety layer.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => robotApi.connect().then((r: any) => setConnected(r.leader_connected && r.follower_connected)).catch(() => {})}
              className="btn btn-outline"
            >
              Connect Arms
            </button>
            <button
              onClick={() => robotApi.calibrate().then((r: any) => setCalibrated(r.calibrated)).catch(() => {})}
              disabled={!connected}
              className="btn btn-outline"
            >
              Calibrate
            </button>
            <button
              onClick={() => robotApi.home().catch(() => {})}
              disabled={!connected}
              className="btn btn-primary"
            >
              Go Home
            </button>
            <EstopButton
              active={!!robot.emergency_stop}
              onClear={() => robotApi.emergencyStopClear()}
              onTrigger={() => robotApi.emergencyStop()}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200">Joint Controls</h3>
              <ModeChip mode={robot.mode} />
            </div>
            <div className="space-y-3">
              {JOINTS.map((j) => {
                const js = robot.joints.find((x: any) => x.index === j.index);
                const pos = js ? js.position : 0;
                const tgt = js ? js.target : 0;
                return (
                  <div key={j.index} className="panel p-3 border-slate-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-300">
                        {j.label} (J{j.index + 1})
                      </span>
                      <span className="text-xs text-saedge-muted">
                        {((pos * 180) / Math.PI).toFixed(1)}°
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        step={1}
                        value={Math.round((pos * 180) / Math.PI)}
                        onChange={(e) =>
                          robotApi
                            .joint(j.index, (parseFloat(e.target.value) * Math.PI) / 180, "manual")
                            .catch(() => {})
                        }
                        className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-saedge-accent"
                      />
                      <input
                        type="number"
                        value={Math.round((pos * 180) / Math.PI)}
                        onChange={(e) =>
                          robotApi
                            .joint(
                              j.index,
                              ((parseFloat(e.target.value) || 0) * Math.PI) / 180,
                              "manual"
                            )
                            .catch(() => {})
                        }
                        className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-saedge-accent"
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-slate-500">-180°</span>
                      <div className="flex-1 h-1 bg-slate-800/50 rounded">
                        <div
                          className="h-full bg-slate-600/40 rounded"
                          style={{ width: `${((tgt + Math.PI) / (2 * Math.PI)) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">180°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel p-5 lg:col-span-2">
            <div className="panel-header">
              <h3 className="text-sm font-semibold text-slate-200">Gripper &amp; Motion</h3>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => robotApi.gripper(true, "manual").catch(() => {})}
                className="btn btn-outline flex-1"
              >
                <Hand size={16} className="mr-2" /> Open
              </button>
              <button
                onClick={() => robotApi.gripper(false, "manual").catch(() => {})}
                className="btn btn-outline flex-1"
              >
                <Hand size={16} className="mr-2" /> Close
              </button>
            </div>
            <div className="mt-5 space-y-3">
              <button
                onClick={() => robotApi.stop("manual").catch(() => {})}
                disabled={!connected}
                className="btn btn-danger w-full"
              >
                <StopCircle size={18} className="mr-2" /> Stop Motion
              </button>
              <button
                onClick={() => robotApi.disconnect().then(() => setConnected(false)).catch(() => {})}
                disabled={!connected}
                className="btn btn-outline w-full text-slate-400"
              >
                <Bot size={16} className="mr-2" /> Disconnect
              </button>
            </div>
            <div className="mt-5 p-3 bg-slate-800/30 rounded border border-slate-800">
              <p className="text-xs text-slate-400 mb-1">Connection</p>
              <p className="text-sm text-slate-200">
                {connected ? "Connected (simulation)" : "Disconnected"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Calibrated: {calibrated ? "Yes" : "No"} &middot; Mode:{robot.mode}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
