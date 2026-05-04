export type TodoPriority = "low" | "medium" | "high";

export type TodoFilter = "all" | "active" | "completed" | "archived";

export type Todo = {
  id: string;
  title: string;
  notes: string;
  priority: TodoPriority;
  tags: string[];
  project: string;
  repeat: "none" | "daily" | "weekly" | "monthly";
  archived: boolean;
  archivedAt: string | null;
  reminderAt: string | null;
  notificationId: string | null;
  completed: boolean;
  completedAt: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TodoDraft = {
  title: string;
  notes: string;
  priority: TodoPriority;
  tags: string;
  project: string;
  repeat: "none" | "daily" | "weekly" | "monthly";
  reminderAt: string;
  dueDate: string | null;
};
