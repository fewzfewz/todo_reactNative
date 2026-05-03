export type TodoPriority = "low" | "medium" | "high";

export type TodoFilter = "all" | "active" | "completed";

export type Todo = {
  id: string;
  title: string;
  notes: string;
  priority: TodoPriority;
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
  dueDate: string | null;
};
