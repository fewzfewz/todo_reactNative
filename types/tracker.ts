export type TrackerDay = {
  date: string;
  created: number;
  completed: number;
  urgent: number;
};

export type TrackerSummary = {
  totalCreated: number;
  totalCompleted: number;
  streak: number;
  bestDay: string | null;
  bestDayCount: number;
};

export type TrackerLogItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  kind: "created" | "completed" | "urgent";
};
