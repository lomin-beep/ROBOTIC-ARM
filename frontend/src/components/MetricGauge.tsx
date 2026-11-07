export default function MetricGauge({
  value,
  max = 100,
  label,
  unit = "%",
}: {
  value: number;
  max?: number;
  label: string;
  unit?: string;
}) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const getColor = (v: number) => {
    if (v < 60) return "bg-emerald-500";
    if (v < 85) return "bg-amber-500";
    return "bg-red-500";
  };
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-mono text-slate-300">{value.toFixed(0)}{unit}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
        <div
          className={`h-full ${getColor(pct)} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>0</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}
