"""Model evaluator placeholder."""


class Evaluator:
    def evaluate(self, checkpoint: str, episodes: int = 5) -> dict:
        return {
            "checkpoint": checkpoint,
            "episodes": episodes,
            "success_rate": 0.0,
            "note": "Simulation mode - no real evaluation",
        }


evaluator = Evaluator()
