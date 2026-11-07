import { useEffect, useState } from "react";
import { Microscope, Play, Bot, List } from "lucide-react";
import { tasksApi, robotApi } from "../services/api";
import { EstopButton } from "../components";

const EXAMPLES = [
  "Pick up the red block and place it inside the blue container.",
  "Sort the blocks by colour into the matching bowls.",
  "Move the object from the left tray to the right tray.",
  "Grasp the bottle and lift it 10 cm.",
];

export default function AITaskStudio() {
  const [instruction, setInstruction] = useState(EXAMPLES[0]);
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [robot, setRobot] = useState<any>({ mode: "stopped", emergency_stop: false });

  useEffect(() => {
    robotApi.status().then(setRobot).catch(() => {});
  }, []);

  const useExample = (text: string) => {
    setInstruction(text);
    setResult(null);
  };

  const execute = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await tasksApi.execute(instruction);
      setResult(res);
    } catch (e: any) {
      setResult({ status: "error", reason: e.message || String(e) });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">AI Task Studio</h1>
          <p className="text-slate-400 text-sm">
            Structured task interface. Commands are decomposed into bounded,
            safety-checked robot actions — a model never generates raw servo
            commands.
          </p>
        </div>
        <EstopButton
          active={robot.emergency_stop === true}
          onClear={() => robotApi.emergencyStopClear()}
          onTrigger={() => robotApi.emergencyStop()}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Microscope size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Instruction</h3>
          </div>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            className="w-full h-32 input mb-3 font-mono text-sm"
            placeholder="e.g. Pick up the red block and place it inside the blue container."
          />
          <div className="flex gap-2 mb-4">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => useExample(ex)}
                className="text-xs border border-slate-700 rounded px-3 py-1.5 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition"
              >
                {ex.split(" ").slice(0, 4).join(" ")}…
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={execute}
              disabled={running || robot.emergency_stop === true}
              className="btn btn-primary flex-1"
            >
              <Play size={16} className={running ? "mr-2 animate-spin" : "mr-2"} />
              {running ? "Executing…" : "Execute Task"}
            </button>
            <button
              onClick={() => robotApi.stop("ai").catch(() => {})}
              disabled={running || robot.emergency_stop === true}
              className="btn btn-danger"
            >
              <Bot size={16} className="mr-2" /> Stop
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Language → planner → validated actions → motion controller. The
            motion planner retains authority over physical execution.
          </p>
        </div>

        <div className="panel p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <List size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Task Plan</h3>
          </div>
          {result ? (
            <>
              <div className="mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Status: {result.status}
                </span>
              </div>
              <div className="space-y-2">
                {(result.steps || []).map((step: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-2.5 rounded border bg-slate-900/50 border-slate-800/50"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm text-slate-200">{step.action}</p>
                      {step.detections && (
                        <p className="text-[10px] text-slate-500 mt-1">
                          {step.detections.length} objects detected
                        </p>
                      )}
                      {step.plan && (
                        <p className="text-[10px] text-slate-500 mt-1">
                          Grasp: {step.plan.approach}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {result.targets && (
                <div className="mt-3 p-2 bg-slate-950 rounded border border-slate-800 text-[10px] text-slate-400">
                  {JSON.stringify(result.targets)}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-32 items-center justify-center text-slate-500 text-sm">
              Execute a task to see the plan
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
