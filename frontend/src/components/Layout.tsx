import { useState } from "react";
import {
  LayoutDashboard,
  Bot,
  Camera,
  Microscope,
  Save,
  Settings,
  Link,
  AlertCircle,
  PlayCircle,
  Monitor,
  Wifi,
  Battery,
} from "lucide-react";

const NAV: { id: string; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "robot", label: "Robot Control", icon: Bot },
  { id: "vision", label: "Vision Studio", icon: Camera },
  { id: "tasks", label: "AI Task Studio", icon: Microscope },
  { id: "teleop", label: "Teleoperation", icon: Link },
  { id: "datasets", label: "Dataset Studio", icon: Save },
  { id: "models", label: "Model Studio", icon: PlayCircle },
  { id: "settings", label: "Settings & Safety", icon: Settings },
];

export default function Layout({
  page,
  onPageChange,
  children,
}: {
  page: string;
  onPageChange: (page: string) => void;
  children: (page: string) => React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 w-64 transition-all duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } bg-slate-900 border-r border-slate-800 flex flex-col`}
      >
        <div className="px-5 py-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-saedge-accent to-cyan-900 flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <span className="font-bold text-sm text-slate-100 tracking-tight">
            SAEDGE
          </span>
          <span className="text-xs text-saedge-muted ml-1">AI Studio</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = page === n.id;
            return (
              <button
                key={n.id}
                onClick={() => onPageChange(n.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  active
                    ? "bg-saedge-accent/10 text-saedge-accent border border-saedge-accent/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Icon size={18} className={`shrink-0 ${active ? "text-saedge-accent" : "text-slate-500"}`} />
                {n.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-slate-500 mb-2">v1.0.0 &middot; Orin Nano</div>
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white"
          >
            {open ? <span className="w-4 h-0.5 bg-slate-600"></span> : <Link size={14} />} {open ? "Collapse" : "Expand"}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open ? null : (
        <div className="fixed inset-0 z-10 bg-black/60 backdrop-blur lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${
        open ? "ml-64" : "ml-0"
      } lg:ml-0`}>
        <TopNav openSidebar={setOpen} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children(page)}
        </main>
      </div>
    </div>
  );
}

function TopNav({ openSidebar }: { openSidebar: (v: boolean) => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-6 bg-slate-950/90 border-b border-slate-800 backdrop-blur">
      <div className="flex items-center gap-4">
        <button
          onClick={() => openSidebar(true)}
          className="lg:hidden p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <span className="w-6 h-0.5 bg-slate-400"></span>
        </button>
        <div className="hidden lg:flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs text-slate-300 font-medium">System Online</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><Monitor size={14} /> Dash</span>
          <span className="w-px h-3 bg-slate-700"></span>
          <span className="flex items-center gap-1.5"><Wifi size={14} /> LAN</span>
          <span className="w-px h-3 bg-slate-700"></span>
          <span className="flex items-center gap-1.5"><Battery size={14} /> Orin Nano</span>
        </div>
      </div>
    </header>
  );
}

/* reusable bits */
export function StatusCard({
  title,
  value,
  sub,
  status = "neutral",
  icon: Icon,
}: {
  title: string;
  value: React.ReactNode;
  sub?: string;
  status?: "neutral" | "online" | "offline" | "warning" | "danger";
  icon?: any;
}) {
  const badge = (() => {
    switch (status) {
      case "online": return "badge-online";
      case "offline": return "badge-offline";
      case "warning": return "badge-warning";
      case "danger": return "badge-danger";
      default: return "badge-offline";
    }
  })();
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={16} className="text-slate-500 shrink-0" />}
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
        </div>
        <span className={`badge ${badge}`}>{status}</span>
      </div>
      <div className="text-2xl font-bold text-slate-100">{value}</div>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export function EstopButton({
  active,
  onClear,
  onTrigger,
}: {
  active: boolean;
  onClear: () => void;
  onTrigger: () => void;
}) {
  return (
    <button
      onClick={active ? onClear : onTrigger}
      className={`w-full py-3 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all ${
        active
          ? "bg-emerald-900/50 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          : "bg-red-900/60 border border-red-500/60 text-red-400 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 animate-pulse-fast"
      }`}
    >
      {active ? (
        <>
          <AlertCircle size={18} className="animate-blink" />
          CLEAR EMERGENCY STOP
        </>
      ) : (
        <>
          <AlertCircle size={18} />
          EMERGENCY STOP
        </>
      )}
    </button>
  );
}

export function ModeChip({ mode }: { mode: string }) {
  const conf: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    stopped: { bg: "bg-slate-800/50", border: "border-slate-700/50", text: "text-slate-400", dot: "bg-slate-500" },
    manual: { bg: "bg-blue-900/40", border: "border-blue-500/30", text: "text-blue-400", dot: "bg-blue-500" },
    teleoperation: { bg: "bg-purple-900/40", border: "border-purple-500/30", text: "text-purple-400", dot: "bg-purple-500" },
    ai_inference: { bg: "bg-emerald-900/40", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-500" },
    recording: { bg: "bg-amber-900/40", border: "border-amber-500/30", text: "text-amber-400", dot: "bg-amber-500" },
  };
  const c = conf[mode] || conf.stopped;
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${c.bg} ${c.border} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`}></span>
      {mode.replace("_", " ")}
    </span>
  );
}

export function JointControl({
  index,
  label,
  position,
  target,
  onChange,
}: {
  index: number;
  label: string;
  position: number;
  target: number;
  onChange: (v: number) => void;
}) {
  const deg = (r: number) => Math.round((r * 180) / Math.PI);
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-300">{label} (J{index + 1})</span>
        <span className="text-xs text-saedge-muted">{deg(position)}° / {deg(target)}°</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={deg(-3.14)}
          max={deg(3.14)}
          step={1}
          value={deg(position)}
          onChange={(e) => onChange((parseFloat(e.target.value) * Math.PI) / 180)}
          className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-saedge-accent"
        />
        <input
          type="number"
          value={deg(position)}
          onChange={(e) => onChange((parseFloat(e.target.value) || 0) * (Math.PI / 180))}
          className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-saedge-accent"
        />
      </div>
    </div>
  );
}
