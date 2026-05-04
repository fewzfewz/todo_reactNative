import { Habit } from "@/types/habit";

export type HabitTrackerDay = {
  date: string;
  checkIns: number;
};

export type HabitGroupSummary = {
  group: string;
  color: string;
  habitCount: number;
  weeklyCheckIns: number;
  weeklyGoal: number;
  totalCheckIns: number;
  bestStreak: number;
  score: number;
};

const toDayKey = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const buildHabitDays = (habit: Habit, count = 84): HabitTrackerDay[] => {
  const days: HabitTrackerDay[] = [];
  const today = new Date();

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    days.push({
      date: toDayKey(date),
      checkIns: habit.checkIns.includes(toDayKey(date)) ? 1 : 0,
    });
  }

  return days;
};

export const buildHabitWeekSeries = (habit: Habit) => {
  const recentDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = toDayKey(date);
    return {
      date: key,
      checkIns: habit.checkIns.includes(key) ? 1 : 0,
    };
  });

  return recentDays;
};

export const countHabitStreak = (checkIns: string[]) => {
  const sorted = [...new Set(checkIns)].sort();
  let streak = 0;
  let cursor = toDayKey(new Date());

  while (sorted.includes(cursor)) {
    streak += 1;
    const next = new Date(`${cursor}T00:00:00`);
    next.setDate(next.getDate() - 1);
    cursor = toDayKey(next);
  }

  return streak;
};

export const buildHabitGroupSummaries = (habits: Habit[]) => {
  const active = habits.filter((habit) => !habit.archived);
  const groups = new Map<string, Habit[]>();

  for (const habit of active) {
    const group = habit.group.trim() || "Unsorted";
    const current = groups.get(group) ?? [];
    current.push(habit);
    groups.set(group, current);
  }

  const todayKey = toDayKey(new Date());
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoKey = toDayKey(sevenDaysAgo);

  return [...groups.entries()]
    .map(([group, groupHabits]) => {
      const weeklyGoal = groupHabits.reduce((sum, habit) => sum + Math.max(1, habit.goalPerWeek || 7), 0);
      const totalCheckIns = groupHabits.reduce((sum, habit) => sum + habit.checkIns.length, 0);
      const weeklyCheckIns = groupHabits.reduce(
        (sum, habit) => sum + habit.checkIns.filter((checkIn) => checkIn >= sevenDaysAgoKey && checkIn <= todayKey).length,
        0,
      );
      const bestStreak = Math.max(0, ...groupHabits.map((habit) => countHabitStreak(habit.checkIns)));
      const averageGoal = Math.max(1, weeklyGoal);
      const score = Math.min(5, Math.round((weeklyCheckIns / averageGoal) * 5));

      return {
        group,
        color: groupHabits[0]?.color ?? "#3b82f6",
        habitCount: groupHabits.length,
        weeklyCheckIns,
        weeklyGoal,
        totalCheckIns,
        bestStreak,
        score,
      } satisfies HabitGroupSummary;
    })
    .sort((a, b) => b.weeklyCheckIns - a.weeklyCheckIns || a.group.localeCompare(b.group));
};
