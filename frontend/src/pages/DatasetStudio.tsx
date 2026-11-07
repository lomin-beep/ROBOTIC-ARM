import { useEffect, useState } from "react";
import { Play, StopCircle, Database, Save } from "lucide-react";
import { datasetsApi } from "../services/api";
import EpisodeList from "../components/EpisodeList";

export default function DatasetStudio() {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [recording, setRecording] = useState(false);
  const [episodeId, setEpisodeId] = useState<string | null>(null);

  useEffect(() => {
    datasetsApi.episodes().then(({ episodes: e }) => setEpisodes(e)).catch(() => {});
  }, []);

  const start = async () => {
    const res = await datasetsApi.record("teleop_demo");
    setRecording(true);
    setEpisodeId(res.episode_id);
  };

  const stop = async () => {
    const res = await datasetsApi.stop();
    setRecording(false);
    setEpisodeId(res.episode_id);
    datasetsApi.episodes().then(({ episodes: e }) => setEpisodes(e)).catch(() => {});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dataset Studio</h1>
          <p className="text-slate-400 text-sm">
            Record demonstration episodes. Data is stored in native LeRobot
            format (images + joint states + actions).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Save size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Recording</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-slate-900 rounded border border-slate-800">
              <p className="text-xs text-slate-400 mb-2">Task description</p>
              <input
                defaultValue="teleoperation_demo"
                className="w-full input"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={start}
                disabled={recording}
                className="btn btn-success flex-1"
              >
                <Play size={16} className="mr-2" /> Start Recording
              </button>
              <button
                onClick={stop}
                disabled={!recording}
                className="btn btn-danger flex-1"
              >
                <StopCircle size={16} className="mr-2" /> Stop Recording
              </button>
            </div>
            {recording && (
              <div className="mt-3 p-3 bg-emerald-900/20 border border-emerald-500/20 rounded">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-sm text-emerald-400 font-medium">
                    Recording episode {episodeId}
                  </span>
                </div>
                <p className="text-xs text-emerald-300/70 mt-1">
                  Capturing images + joint states + actions at 30 Hz
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Dataset Info</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Format</span>
              <span className="text-slate-200">LeRobotDataset</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Cameras</span>
              <span className="text-slate-200">Environment + Wrist</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Data per step</span>
              <span className="text-slate-200">2 images, 6 joints, gripper</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Export</span>
              <span className="text-slate-200">JSONL / Hugging Face</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Use the LeRobot dataset format so episodes can be consumed directly
            by ACT training.
          </p>
        </div>
      </div>

      <EpisodeList
        episodes={episodes}
        onRecord={start}
        onStop={stop}
        recording={recording}
        episodeId={episodeId}
      />
    </div>
  );
}
