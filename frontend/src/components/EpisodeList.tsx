export default function EpisodeList({
  episodes,
  onRecord,
  onStop,
  recording,
  episodeId,
}: {
  episodes: any[];
  onRecord: () => void;
  onStop: () => void;
  recording: boolean;
  episodeId: string | null;
}) {
  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Recorded Episodes</h3>
          <p className="text-xs text-slate-500">LeRobot-format JSONL logs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRecord}
            disabled={recording}
            className="btn btn-success px-3"
          >
            Record
          </button>
          <button
            onClick={onStop}
            disabled={!recording}
            className="btn btn-outline px-3"
          >
            Stop
          </button>
        </div>
      </div>

      {recording && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-xs text-emerald-400 font-medium">
            Recording: {episodeId || "episode…"}
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-xs text-slate-400 pb-2 font-semibold">ID</th>
              <th className="text-left text-xs text-slate-400 pb-2 font-semibold">Task</th>
              <th className="text-left text-xs text-slate-400 pb-2 font-semibold">Steps</th>
              <th className="text-right text-xs text-slate-400 pb-2 font-semibold">File</th>
            </tr>
          </thead>
          <tbody>
            {episodes.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-slate-500 text-xs py-6">
                  No episodes recorded yet
                </td>
              </tr>
            ) : (
              episodes.map((e) => (
                <tr key={e.id} className="border-b border-slate-800/50">
                  <td className="py-2 text-slate-300">{e.id}</td>
                  <td className="py-2 text-slate-200">{e.task || "untitled"}</td>
                  <td className="py-2 text-saedge-muted">{e.steps}</td>
                  <td className="py-2 text-right text-xs text-slate-500">{e.file}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
