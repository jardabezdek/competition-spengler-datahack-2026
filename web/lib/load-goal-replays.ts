import type { GoalReplays } from "@/lib/goal-replay";
import { readProjectFile } from "@/lib/project-files";

export function loadGoalReplays(): GoalReplays {
  return JSON.parse(readProjectFile("data/processed/goal_replays.json"));
}
