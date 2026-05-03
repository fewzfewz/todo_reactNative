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
      created: 0,
      completed: 0,
      urgent: 0,
    });
  }

  return days;
};

export const buildTrackerDays = (todos: Todo[], count = 84) => {
  const days = makeDays(count);
  const index = new Map(days.map((day, position) => [day.date, position]));

  for (const todo of todos) {
    const createdKey = toDayKey(todo.createdAt);
    const createdIndex = index.get(createdKey);
    if (createdIndex !== undefined) {
      days[createdIndex].created += 1;
      if (todo.priority === "high") {
        days[createdIndex].urgent += 1;
      }
    }

    if (todo.completedAt) {
      const completedKey = toDayKey(todo.completedAt);
      const completedIndex = index.get(completedKey);
      if (completedIndex !== undefined) {
        days[completedIndex].completed += 1;
      }
    }
  }

  return days;
};

export const buildTrackerSummary = (todos: Todo[], days: TrackerDay[]): TrackerSummary => {
  const totalCreated = todos.length;
  const totalCompleted = todos.filter((todo) => todo.completed).length;

  let streak = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index].completed === 0) {
      break;
    }

    streak += 1;
  }

  const bestDay = days.reduce<TrackerDay | null>((current, day) => {
    if (!current || day.completed > current.completed) {
      return day;
    }

    return current;
  }, null);

  return {
    totalCreated,
    totalCompleted,
    streak,
    bestDay: bestDay?.date ?? null,
    bestDayCount: bestDay?.completed ?? 0,
  };
};

export const buildTrackerLog = (todos: Todo[]): TrackerLogItem[] => {
  const items: TrackerLogItem[] = [];

  for (const todo of todos) {
    items.push({
      id: `${todo.id}-created`,
      title: todo.title,
      subtitle: todo.createdAt,
      time: todo.createdAt,
      kind: "created",
    });

    if (todo.completedAt) {
      items.push({
        id: `${todo.id}-completed`,
        title: todo.title,
        subtitle: todo.completedAt,
        time: todo.completedAt,
        kind: "completed",
      });
    }
  }

  return items
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 8)
    .map((item) => ({
      ...item,
      subtitle: item.kind === "created" ? "Created" : "Completed",
      time: new Date(item.time).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    }));
};

export const getIntensity = (value: number) => {
  if (value <= 0) return 0;
  if (value === 1) return 1;
  if (value === 2) return 2;
  if (value <= 4) return 3;
  return 4;
};

export const getWeekLabels = (days: TrackerDay[]) => {
  const recent = days.slice(-7);
  return recent.map((day) => new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" }));
};

export const getPercent = (part: number, total: number) => (total === 0 ? 0 : Math.round((part / total) * 100));

export const getDayLabel = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export const isWithinSevenDays = (date: string) => {
  const today = new Date();
  const target = new Date(`${date}T00:00:00`);
  return Math.abs(today.getTime() - target.getTime()) <= 7 * dayMs;
};
