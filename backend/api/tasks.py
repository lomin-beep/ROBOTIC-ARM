"""Task execution API endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from ai.grasp_planning import grasp_planner
from ai.inference_engine import inference_engine

router = APIRouter(tags=["tasks"])


@router.post("/tasks/execute", response_model=dict)
async def execute_task(instruction: str):
    """Execute a structured task instruction (simulation).

    On the Jetson this decomposes natural language into bounded, safety-checked
    robot actions. Here we plan a grasp and move the follower arm through it.
    """
    from core.safety import safety
    from hardware.servo_manager import servo_manager

    if safety.is_emergency_stop_active():
        return {"status": "rejected", "reason": "Emergency stop active"}

    instruction_lower = instruction.lower()
    result = {"instruction": instruction, "steps": [], "status": "planned"}

    # Detect objects
    detections = inference_engine.run_detection("environment")
    result["steps"].append(
        {"step": 1, "action": "detect_objects", "detections": detections}
    )

    target = None
    for keyword in ("block", "cup", "bottle", "box", "bowl"):
        if keyword in instruction_lower:
            target = keyword
            break
    if not target and detections:
        target = detections[0]["label"]

    if target:
        plan = grasp_planner.plan_grasp(target)
        result["steps"].append(
            {"step": 2, "action": "plan_grasp", "plan": plan}
        )
        if plan and not safety.is_emergency_stop_active():
            targets = plan["joint_targets"]
            servo_manager.set_follower_joints(targets, owner="ai")
            result["steps"].append(
                {"step": 3, "action": "move_to_grasp", "targets": targets}
            )
            result["status"] = "executing"
        else:
            result["status"] = "planned_only"
    else:
        result["status"] = "no_target"

    return result
