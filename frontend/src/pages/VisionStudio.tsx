import { useEffect, useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { CameraFeed, DetectionList } from "../components";
import { visionApi } from "../services/api";
import { subscribeWs } from "../services/api";
import type { Detection } from "../types";

export default function VisionStudio() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    visionApi.detections("environment").then(({ detections: d }) => setDetections(d)).catch(() => {});
  }, []);

  useEffect(() => {
    const unsub = subscribeWs("vision-results", (data: any) => {
      setDetections(data.detections || []);
    });
    return unsub;
  }, []);

  const runDetection = async () => {
    setRefreshing(true);
    try {
      const { detections: d } = await visionApi.run("environment");
      setDetections(d);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Vision Studio</h1>
          <p className="text-slate-400 text-sm">
            Live camera feeds, object detection, and target selection.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runDetection}
            disabled={refreshing}
            className="btn btn-outline"
          >
            <RefreshCw size={16} className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Detecting…" : "Run Detection"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <CameraFeed name="environment" label="Environment Camera" />
          <CameraFeed name="wrist" label="Wrist Camera" />
        </div>

        <div className="panel p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Search size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Detections</h3>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400">Target</span>
            <div className="flex gap-1">
              {[ "block", "cup", "bottle", "box" ].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelected(t === selected ? null : t)}
                  className={`px-2 py-1 rounded text-xs border transition ${
                    selected === t
                      ? "bg-saedge-accent text-slate-950 border-saedge-accent"
                      : "border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <DetectionList detections={detections} />
          <div className="mt-4 p-3 bg-slate-800/30 rounded border border-slate-800">
            <p className="text-xs text-slate-400 mb-2">Selected Target</p>
            <span className={`text-sm font-medium ${
              selected ? "text-saedge-accent" : "text-slate-500"
            }`}>
              {selected || "—"}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Pixel detection ≠ 3D position. Camera-to-robot calibration
              required for grasp planning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
