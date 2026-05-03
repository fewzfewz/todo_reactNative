import { Habit } from "@/types/habit";
import { Todo } from "@/types/todo";
import { TrackerDay, TrackerLogItem, TrackerSummary } from "@/types/tracker";

const dayMs = 24 * 60 * 60 * 1000;

const toDayKey = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const makeDays = (count: number) => {
  const days: TrackerDay[] = [];
  const today = new Date();

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    days.push({
      date: toDayKey(date),
      todoCreated: 0,
      todoCompleted: 0,
      habitCheckIns: 0,
      urgent: 0,
    });
  }

  return days;
};

const dayIndex = (days: TrackerDay[], date: string) => days.findIndex((day) => day.date === date);

export const buildTrackerDays = (todos: Todo[], habits: Habit[], count = 84) => {
  const days = makeDays(count);

  for (const todo of todos) {
    if (todo.archived) {
      continue;
    }

    const createdIndex = dayIndex(days, toDayKey(todo.createdAt));
    if (createdIndex !== -1) {
      days[createdIndex].todoCreated += 1;
      if (todo.priority === "high") {
        days[createdIndex].urgent += 1;
      }
    }

    if (todo.completedAt) {
      const completedIndex = dayIndex(days, toDayKey(todo.completedAt));
      if (completedIndex !== -1) {
        days[completedIndex].todoCompleted += 1;
      }
    }
  }

  for (const habit of habits) {
    if (habit.archived) {
      continue;
    }

    for (const checkIn of habit.checkIns) {
      const checkInIndex = dayIndex(days, toDayKey(checkIn));
      if (checkInIndex !== -1) {
        days[checkInIndex].habitCheckIns += 1;
      }
    }
  }

  return days;
};

const findBestStreak = (days: TrackerDay[]) => {
  let streak = 0;
  let best = 0;

  for (const day of days) {
    const activity = day.todoCompleted + day.habitCheckIns;
    if (activity > 0) {
      streak += 1;
      best = Math.max(best, streak);
    } else {
      streak = 0;
    }
  }

  return best;
};

export const buildTrackerSummary = (todos: Todo[], habits: Habit[], days: TrackerDay[]): TrackerSummary => {
  const totalTodos = todos.filter((todo) => !todo.archived).length;
  const totalHabits = habits.filter((habit) => !habit.archived).length;
  const totalCheckIns = habits.filter((habit) => !habit.archived).reduce((sum, habit) => sum + habit.checkIns.length, 0);
  const totalCompletions = todos.filter((todo) => todo.completed && !todo.archived).length;

  let streak = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    const activity = days[index].todoCompleted + days[index].habitCheckIns;
    if (activity === 0) {
      break;
    }

    streak += 1;
  }

  const busiestDay = days.reduce<TrackerDay | null>((current, day) => {
    const currentScore = current ? current.todoCreated + current.todoCompleted + current.habitCheckIns : -1;
    const dayScore = day.todoCreated + day.todoCompleted + day.habitCheckIns;
    return !current || dayScore > currentScore ? day : current;
  }, null);

  return {
    totalTodos,
    totalHabits,
    totalCheckIns,
    totalCompletions,
    streak,
    bestDay: busiestDay?.date ?? null,
    bestDayCount: busiestDay ? busiestDay.todoCreated + busiestDay.todoCompleted + busiestDay.habitCheckIns : 0,
    bestStreak: findBestStreak(days),
    busiestDay: busiestDay?.date ?? null,
    busiestDayCount: busiestDay ? busiestDay.todoCreated + busiestDay.todoCompleted + busiestDay.habitCheckIns : 0,
  };
};

export const buildTrackerLog = (todos: Todo[], habits: Habit[]): TrackerLogItem[] => {
  const items: TrackerLogItem[] = [];

  for (const todo of todos) {
    if (!todo.archived) {
      items.push({
        id: `${todo.id}-created`,
        title: todo.title,
        subtitle: "Created todo",
        time: todo.createdAt,
        kind: "todo-created",
      });
    }

    if (todo.completedAt && !todo.archived) {
      items.push({
        id: `${todo.id}-completed`,
        title: todo.title,
        subtitle: "Completed todo",
        time: todo.completedAt,
        kind: "todo-completed",
      });
    }
  }

  for (const habit of habits) {
    if (!habit.archived) {
      items.push({
        id: `${habit.id}-created`,
        title: habit.title,
        subtitle: "Created habit",
        time: habit.createdAt,
        kind: "habit-created",
      });
    }

    for (const checkIn of habit.checkIns) {
      items.push({
        id: `${habit.id}-${checkIn}`,
        title: habit.title,
        subtitle: "Habit checked in",
        time: `${checkIn}T00:00:00`,
        kind: "habit-check-in",
      });
    }
  }

  return items
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 12)
    .map((item) => ({
      ...item,
      time: new Date(item.time).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    }));
};

export const buildMonthlySeries = (days: TrackerDay[]) => {
  const recent = days.slice(-28);
  return recent.reduce(
    (series, day, index) => {
      const week = Math.floor(index / 7);
      series[week] += day.todoCompleted + day.habitCheckIns;
      return series;
    },
    [0, 0, 0, 0],
  );
};

export const getIntensity = (value: number) => {
  if (value <= 0) return 0;
  if (value === 1) return 1;
  if (value === 2) return 2;
  if (value <= 4) return 3;
  return 4;
};

export const getPercent = (part: number, total: number) => (total === 0 ? 0 : Math.round((part / total) * 100));

export const getDayLabel = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export const getDayActivity = (day: TrackerDay) => day.todoCreated + day.todoCompleted + day.habitCheckIns;

export const getWeekLabels = (days: TrackerDay[]) => {
  const recent = days.slice(-7);
  return recent.map((day) => new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" }));
};

export const isWithinSevenDays = (date: string) => {
  const today = new Date();
  const target = new Date(`${date}T00:00:00`);
  return Math.abs(today.getTime() - target.getTime()) <= 7 * dayMs;
};
