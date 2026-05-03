import { useMemo } from "react";

import { useHabits } from "@/hooks/useHabits";
import { useTodos } from "@/hooks/useTodos";
import { buildTrackerDays, buildTrackerLog, buildTrackerSummary, getPercent } from "@/utils/tracker";

export function useTracker() {
  const { todos, stats: todoStats } = useTodos();
  const { habits, stats: habitStats } = useHabits();

  const days = useMemo(() => buildTrackerDays(todos, habits), [habits, todos]);
  const summary = useMemo(() => buildTrackerSummary(todos, habits, days), [days, habits, todos]);
  const log = useMemo(() => buildTrackerLog(todos, habits), [habits, todos]);
  const week = days.slice(-7);
  const completionRate = getPercent(todoStats.completed + habitStats.completedToday, todoStats.total + habitStats.total);

  return {
    days,
    summary,
    log,
    week,
    completionRate,
    todoStats,
    habitStats,
  };
}
