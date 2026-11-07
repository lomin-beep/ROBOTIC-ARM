import { useState } from "react";
import { Settings, ShieldAlert, SlidersHorizontal, Camera, Link, AlertCircle } from "lucide-react";

const LIMITS = [
  { joint: "J1 Shoulder Pan", min: "-180°", max: "180°", default: "0°" },
  { joint: "J2 Shoulder Lift", min: "-90°", max: "90°", default: "-30°" },
  { joint: "J3 Elbow Flex", min: "-90°", max: "90°", default: "30°" },
  { joint: "J4 Wrist Flex", min: "-90°", max: "90°", default: "0°" },
  { joint: "J5 Wrist Roll", min: "-90°", max: "90°", default: "0°" },
  { joint: "J6 Gripper", min: "0 rad", max: "1 rad", default: "0 (open)" },
];

export default function SettingsSafety() {
  const [tab, setTab] = useState("safety");

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Settings &amp; Safety</h1>
          <p className="text-slate-400 text-sm">Joint limits, calibration, cameras, and emergency-stop state.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 border-b border-slate-800 pb-2">
        {[
          { id: "safety", label: "Safety", icon: ShieldAlert },
          { id: "limits", label: "Joint Limits", icon: SlidersHorizontal },
          { id: "cameras", label: "Cameras", icon: Camera },
          { id: "usb", label: "USB Devices", icon: Link },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
              tab === t.id
                ? "bg-saedge-accent/10 text-saedge-accent border border-saedge-accent/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "safety" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="panel p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={16} className="text-red-500" />
              <h3 className="text-sm font-semibold text-slate-200">Emergency Stop</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded bg-red-900/20 border border-red-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                  <div>
                    <p className="text-sm font-bold text-red-400">System Estop: ARMED</p>
                    <p className="text-xs text-red-300/70">Software estop is available from the dashboard.</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded bg-slate-800 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">Physical E-stop</p>
                    <p className="text-xs text-slate-400">Hard safety circuit disconnects actuator power.</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded bg-slate-800 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">Watchdog</p>
                    <p className="text-xs text-slate-400">Stale-command watchdog active (2 s timeout)</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-slate-900 rounded border border-slate-800 text-xs text-slate-400">
              <p className="font-semibold mb-1">Safety principles</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Emergency stop and safety: highest priority</li>
                <li>Servo control: very high priority</li>
                <li>AI never generates unrestricted servo commands</li>
                <li>Exclusive ownership of the follower arm</li>
                <li>Physical e-stop is not replaceable by browser estop</li>
              </ul>
            </div>
          </div>
          <div className="panel p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Settings size={16} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-200">Operating Permissions</h3>
            </div>
            <div className="space-y-3">
              {[
                "Manual joint control",
                "Teleoperation (leader → follower)",
                "AI inference execution",
                "Dataset recording",
                "Model training",
              ].map((perm) => (
                <div key={perm} className="flex items-center justify-between p-2 bg-slate-900/50 rounded border border-slate-800/50">
                  <span className="text-sm text-slate-200">{perm}</span>
                  <span className="text-xs text-emerald-400">Allowed</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "limits" && (
        <div className="panel p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Joint Limits (SO-ARM101 calibrated)</h3>
            <p className="text-xs text-slate-500 mt-1">Configure per-joint safe ranges used by the motion planner.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs text-slate-400 pb-3 font-semibold">Joint</th>
                  <th className="text-left text-xs text-slate-400 pb-3 font-semibold">Min</th>
                  <th className="text-left text-xs text-slate-400 pb-3 font-semibold">Max</th>
                  <th className="text-left text-xs text-slate-400 pb-3 font-semibold">Default</th>
                  <th className="text-right text-xs text-slate-400 pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {LIMITS.map((l) => (
                  <tr key={l.joint} className="border-b border-slate-800/50">
                    <td className="py-3 text-slate-300">{l.joint}</td>
                    <td className="py-3 text-slate-200 font-mono">{l.min}</td>
                    <td className="py-3 text-slate-200 font-mono">{l.max}</td>
                    <td className="py-3 text-saedge-muted">{l.default}</td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-900/40 text-emerald-400 border border-emerald-500/30">
                        Valid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "cameras" && (
        <div className="panel p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Camera Configuration</h3>
          <div className="space-y-4">
            {[
              { name: "Environment Camera", device: "/dev/video0", res: "640×480 @ 15 FPS", role: "Object detection, grasp planning" },
              { name: "Wrist Camera", device: "/dev/video2", res: "640×480 @ 15 FPS", role: "Close-up grasp verification" },
            ].map((c) => (
              <div key={c.name} className="p-3 bg-slate-900 rounded border border-slate-800">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-slate-200">{c.name}</span>
                  <span className="text-xs text-emerald-400">Connected</span>
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>{c.device}</span>
                  <span>{c.res}</span>
                  <span>{c.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "usb" && (
        <div className="panel p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">USB Device Management</h3>
          <div className="space-y-4">
            {[
              { name: "Leader BusLinker", device: "/dev/so101_leader", role: "Leader arm serial" },
              { name: "Follower BusLinker", device: "/dev/so101_follower", role: "Follower arm serial" },
            ].map((d) => (
              <div key={d.name} className="p-3 bg-slate-900 rounded border border-slate-800">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-slate-200">{d.name}</span>
                  <span className="text-xs text-emerald-400">Connected</span>
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>{d.device}</span>
                  <span>1000000 baud</span>
                  <span>{d.role}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Persistent udev rules map the BusLinker boards to
            /dev/so101_leader and /dev/so101_follower across reboots.
          </p>
        </div>
      )}
    </div>
  );
}
