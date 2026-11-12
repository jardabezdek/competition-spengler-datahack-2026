import type { GoalReplays } from "@/lib/goal-replay";
import { processedFile, readProjectFile } from "@/lib/project-files";

export function loadGoalReplays(): GoalReplays {
  return JSON.parse(readProjectFile(processedFile("goal_replays.json")));
}
