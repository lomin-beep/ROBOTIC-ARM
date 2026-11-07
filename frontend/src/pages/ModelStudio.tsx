import { useEffect, useState } from "react";
import { Play, Brain, Cpu, Save, AlertTriangle } from "lucide-react";
import { modelsApi } from "../services/api";

export default function ModelStudio() {
  const [checkpoint, setCheckpoint] = useState("act_so101_v1");
  const [status, setStatus] = useState<any>({ loaded: false, checkpoint: null });
  const [action, setAction] = useState<number[] | null>(null);
  const [inferring, setInferring] = useState(false);

  useEffect(() => {
    modelsApi.status().then(setStatus).catch(() => {});
  }, []);

  const load = async () => {
    const res = await modelsApi.load(checkpoint);
    setStatus(res);
  };

  const infer = async () => {
    setInferring(true);
    try {
      const res = await modelsApi.infer(checkpoint);
      setAction(res.action);
    } catch {
      // ignore
    } finally {
      setInferring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Model Studio</h1>
          <p className="text-slate-400 text-sm">
            ACT (Action Chunking with Transformers) policy management via
            LeRobot. Train locally, run inference on-device.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Policy</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Checkpoint</label>
              <input
                value={checkpoint}
                onChange={(e) => setCheckpoint(e.target.value)}
                className="w-full input"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={load} disabled={status.loaded && status.checkpoint === checkpoint} className="btn btn-outline">
                <Save size={16} className="mr-2" /> Load Checkpoint
              </button>
              <button onClick={infer} disabled={inferring || !status.loaded} className="btn btn-primary">
                <Play size={16} className={`mr-2 ${inferring ? "animate-spin" : ""}`} />
                {inferring ? "Inferring…" : "Run Inference"}
              </button>
            </div>
            {action && (
              <div className="mt-3 p-3 bg-slate-950 rounded border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Predicted action (J1–J6)</p>
                <div className="flex gap-2">
                  {action.map((v, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-slate-500">J{i + 1}</span>
                      <span className="text-xs font-mono text-slate-200">{v.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Model loaded</span>
              <span className={`text-xs font-bold ${status.loaded ? "text-emerald-400" : "text-red-400"}`}>
                {status.loaded ? status.checkpoint : "No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Device</span>
              <span className="text-xs text-slate-200">CPU (simulation)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Training</span>
              <span className="text-xs text-amber-400">Disabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Architecture</span>
              <span className="text-xs text-slate-200">ACT / LeRobot</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-amber-900/20 border border-amber-500/20 rounded">
            <p className="text-xs text-amber-400 mb-1">
              <AlertTriangle size={14} className="mr-1" />
              Training disabled while autonomous operation is active
            </p>
            <p className="text-xs text-amber-300/70 mt-1">
              Enable SAEDGE_TRAINING_ENABLED on the Jetson to train ACT locally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
