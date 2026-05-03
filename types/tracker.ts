export type TrackerDay = {
  date: string;
  todoCreated: number;
  todoCompleted: number;
  habitCheckIns: number;
  urgent: number;
};

export type TrackerSummary = {
  totalTodos: number;
  totalHabits: number;
  totalCheckIns: number;
  totalCompletions: number;
  streak: number;
  bestDay: string | null;
  bestDayCount: number;
};

export type TrackerLogItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  kind: "todo-created" | "todo-completed" | "habit-created" | "habit-check-in";
};
