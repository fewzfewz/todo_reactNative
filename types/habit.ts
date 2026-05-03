export type Habit = {
  id: string;
  title: string;
  notes: string;
  color: string;
  checkIns: string[];
  createdAt: string;
  updatedAt: string;
};

export type HabitDraft = {
  title: string;
  notes: string;
  color: string;
};
