import { useEffect, useRef, useState } from "react";
import { Camera, WifiOff, Image, AlertTriangle } from "lucide-react";
import { subscribeWs } from "../services/api";
import type { Detection } from "../types";

export default function CameraFeed({
  name,
  label,
}: {
  name: "environment" | "wrist";
  label: string;
}) {
  const [frame, setFrame] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [fps, setFps] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const unsub = subscribeWs("camera-events", (data: any) => {
      if (data.camera !== name) return;
      if (data.type === "connected") return;
      setConnected(!!data.connected);
      setFps(data.fps || 0);
      if (data.frame) setFrame(data.frame);
    });
    return unsub;
  }, [name]);

  useEffect(() => {
    if (!imgRef.current || !frame) return;
    const img = imgRef.current;
    if (img.complete && img.naturalHeight !== 0) {
      // frame rendered successfully
    }
  }, [frame]);

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Camera size={16} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-200">{label}</span>
          <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
            connected
              ? "bg-emerald-900/40 text-emerald-400 border border-emerald-500/30"
              : "bg-slate-800 text-slate-500 border border-slate-700"
          }`}>
            {connected ? "LIVE" : "OFFLINE"}
          </span>
        </div>
        {fps > 0 && <span className="text-xs text-slate-500">{fps.toFixed(0)} FPS</span>}
      </div>
      <div className="flex-1 relative bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
        {frame ? (
          <img
            ref={imgRef}
            src={frame}
            alt={label}
            className="w-full h-full object-cover max-h-[400px]"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-600">
            {connected ? (
              <Image size={32} className="opacity-50" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <WifiOff size={34} className="opacity-60" />
                <AlertTriangle size={20} className="text-amber-500" />
              </div>
            )}
            <span className="text-sm">{connected ? "Receiving frame…" : "Camera not connected"}</span>
          </div>
        )}
      </div>
      {!connected && (
        <button
          onClick={() => {
            // handled by parent via refresh; placeholder
          }}
          className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 underline"
        >
          Start camera stream
        </button>
      )}
    </div>
  );
}

export function DetectionList({ detections }: { detections: Detection[] }) {
  return (
    <div className="space-y-2">
      {detections.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-4">No objects detected</p>
      ) : (
        detections.map((d, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-900/50 rounded border border-slate-800/50">
            <span className="w-2 h-2 rounded-full bg-saedge-accent shrink-0"></span>
            <span className="text-sm font-medium text-slate-200">{d.label}</span>
            <span className="ml-auto text-xs text-saedge-muted">
              {(d.confidence * 100).toFixed(0)}%
            </span>
            <div className="flex-1 h-1.5 bg-slate-800 rounded overflow-hidden ml-4">
              <div
                className="h-full bg-saedge-accent"
                style={{ width: `${Math.min(d.confidence, 1) * 100}%` }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}


