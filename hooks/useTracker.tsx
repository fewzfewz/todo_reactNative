import { useMemo } from "react";

import { useTodos } from "@/hooks/useTodos";
import { buildTrackerDays, buildTrackerLog, buildTrackerSummary, getPercent } from "@/utils/tracker";

export function useTracker() {
  const { todos, stats } = useTodos();

  const days = useMemo(() => buildTrackerDays(todos), [todos]);
  const summary = useMemo(() => buildTrackerSummary(todos, days), [days, todos]);
  const log = useMemo(() => buildTrackerLog(todos), [todos]);
  const week = days.slice(-7);
  const completionRate = getPercent(stats.completed, stats.total);

  return {
    days,
    summary,
    log,
    week,
    completionRate,
    stats,
  };
}
