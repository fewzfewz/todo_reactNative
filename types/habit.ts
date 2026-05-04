export type Habit = {
  id: string;
  title: string;
  notes: string;
  color: string;
  group: string;
  goalPerWeek: number;
  reminderAt: string | null;
  notificationId: string | null;
  archived: boolean;
  archivedAt: string | null;
  checkIns: string[];
  createdAt: string;
  updatedAt: string;
};

export type HabitDraft = {
  title: string;
  notes: string;
  color: string;
  group: string;
  goalPerWeek: number;
  reminderAt: string;
};
