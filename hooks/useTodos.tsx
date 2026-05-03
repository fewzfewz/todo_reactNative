import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { Todo, TodoDraft } from "@/types/todo";
import { parseReminderInput, shiftDateByRepeat } from "@/utils/date";
import { cancelReminder, scheduleReminder } from "@/utils/reminders";

const STORAGE_KEY = "todos:v2";

const starterTodos: Todo[] = [
  {
    id: "starter-1",
    title: "Plan the day",
    notes: "Pick the three tasks that would make today feel successful.",
    priority: "high",
    tags: ["focus"],
    project: "Personal",
    repeat: "none",
    archived: false,
    archivedAt: null,
    reminderAt: null,
    notificationId: null,
    completed: false,
    completedAt: null,
    dueDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "starter-2",
    title: "Try dark mode",
    notes: "Open Settings and switch the theme.",
    priority: "medium",
    tags: ["setup"],
    project: "Personal",
    repeat: "none",
    archived: false,
    archivedAt: null,
    reminderAt: null,
    notificationId: null,
    completed: false,
    completedAt: null,
    dueDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeTodo = (
  todo: Partial<Todo> &
    Pick<
      Todo,
      "id" | "title" | "notes" | "priority" | "completed" | "dueDate" | "createdAt" | "updatedAt"
    >,
): Todo => ({
  ...todo,
  tags: todo.tags ?? [],
  project: todo.project ?? "Personal",
  repeat: todo.repeat ?? "none",
  archived: todo.archived ?? false,
  archivedAt: todo.archivedAt ?? null,
  reminderAt: todo.reminderAt ?? null,
  notificationId: todo.notificationId ?? null,
  completedAt: todo.completedAt ?? null,
});

const sortTodos = (todos: Todo[]) => {
  const priorityWeight = { high: 0, medium: 1, low: 2 };

  return [...todos].sort((a, b) => {
    if (a.archived !== b.archived) {
      return a.archived ? 1 : -1;
    }

    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }

    if (a.dueDate !== b.dueDate) {
      return a.dueDate ? -1 : 1;
    }

    if (a.priority !== b.priority) {
      return priorityWeight[a.priority] - priorityWeight[b.priority];
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
};

type TodoContextType = ReturnType<typeof useTodosState>;

type TodoAction =
  | { type: "delete"; todo: Todo }
  | { type: "archive"; todo: Todo };

const TodoContext = createContext<TodoContextType | undefined>(undefined);

function useTodosState() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAction, setLastAction] = useState<TodoAction | null>(null);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!mounted) {
          return;
        }

        setTodos(stored ? JSON.parse(stored).map(normalizeTodo) : starterTodos);
      })
      .catch(() => {
        if (mounted) {
          setTodos(starterTodos);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }
  }, [isLoading, todos]);

  const setNotification = useCallback(async (todo: Todo) => {
    await cancelReminder(todo.notificationId);
    const notificationId = await scheduleReminder(
      todo.reminderAt,
      `Task reminder: ${todo.title}`,
      todo.notes || "Open the app to continue this task.",
    );

    if (notificationId) {
      setTodos((current) =>
        current.map((item) => (item.id === todo.id ? { ...item, notificationId } : item)),
      );
    }
  }, []);

  const clearNotification = useCallback(async (todo: Todo) => {
    await cancelReminder(todo.notificationId);
  }, []);

  const addTodo = useCallback(
    async (draft: TodoDraft) => {
      const now = new Date().toISOString();
      const parsedReminder = parseReminderInput(draft.reminderAt);
      const todo: Todo = {
        id: createId(),
        title: draft.title.trim(),
        notes: draft.notes.trim(),
        priority: draft.priority,
        tags: draft.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        project: draft.project.trim() || "Personal",
        repeat: draft.repeat,
        archived: false,
        archivedAt: null,
        reminderAt: parsedReminder ? parsedReminder.toISOString() : null,
        notificationId: null,
        completed: false,
        completedAt: null,
        dueDate: draft.dueDate,
        createdAt: now,
        updatedAt: now,
      };

      setTodos((current) => sortTodos([todo, ...current]));
      await setNotification(todo);
    },
    [setNotification],
  );

  const updateTodo = useCallback(
    async (id: string, draft: TodoDraft) => {
      const existing = todos.find((todo) => todo.id === id);
      if (!existing) {
        return;
      }

      const parsedReminder = parseReminderInput(draft.reminderAt);
      const nextTodo: Todo = {
        ...existing,
        title: draft.title.trim(),
        notes: draft.notes.trim(),
        priority: draft.priority,
        tags: draft.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        project: draft.project.trim() || "Personal",
        repeat: draft.repeat,
        dueDate: draft.dueDate,
        reminderAt: parsedReminder ? parsedReminder.toISOString() : null,
        updatedAt: new Date().toISOString(),
      };

      setTodos((current) => sortTodos(current.map((todo) => (todo.id === id ? nextTodo : todo))));
      await setNotification(nextTodo);
    },
    [setNotification, todos],
  );

  const toggleTodo = useCallback((id: string) => {
    const now = new Date().toISOString();
    const existing = todos.find((todo) => todo.id === id);
    if (!existing) {
      return;
    }

    const isCompleting = !existing.completed;
    const completedTodo: Todo = {
      ...existing,
      completed: isCompleting,
      completedAt: isCompleting ? now : null,
      updatedAt: now,
      archived: existing.archived,
    };

    const nextTodos = todos.map((todo) => (todo.id === id ? completedTodo : todo));

    if (isCompleting && existing.repeat !== "none") {
      const nextDue = shiftDateByRepeat(existing.dueDate, existing.repeat);
      nextTodos.unshift({
        ...existing,
        id: createId(),
        completed: false,
        completedAt: null,
        dueDate: nextDue,
        reminderAt: existing.reminderAt,
        notificationId: null,
        archived: false,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    setTodos(sortTodos(nextTodos));

    if (isCompleting) {
      void clearNotification(existing);
    } else if (existing.reminderAt) {
      void setNotification({ ...existing, completed: false, completedAt: null });
    }
  }, [clearNotification, setNotification, todos]);

  const deleteTodo = useCallback(
    async (id: string) => {
      const existing = todos.find((todo) => todo.id === id);
      if (!existing) {
        return;
      }

      setLastAction({ type: "delete", todo: existing });
      setTodos((current) => current.filter((todo) => todo.id !== id));
      await clearNotification(existing);
    },
    [clearNotification, todos],
  );

  const archiveTodo = useCallback(
    async (id: string) => {
      const existing = todos.find((todo) => todo.id === id);
      if (!existing) {
        return;
      }

      const archivedTodo = {
        ...existing,
        archived: true,
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setLastAction({ type: "archive", todo: existing });
      setTodos((current) => sortTodos(current.map((todo) => (todo.id === id ? archivedTodo : todo))));
      await clearNotification(existing);
    },
    [clearNotification, todos],
  );

  const unarchiveTodo = useCallback((id: string) => {
    setTodos((current) =>
      sortTodos(
        current.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                archived: false,
                archivedAt: null,
                updatedAt: new Date().toISOString(),
              }
            : todo,
        ),
      ),
    );
  }, []);

  const undoLastTodoAction = useCallback(() => {
    if (!lastAction) {
      return;
    }

    if (lastAction.type === "delete") {
      setTodos((current) => sortTodos([lastAction.todo, ...current]));
      if (lastAction.todo.reminderAt) {
        void setNotification(lastAction.todo);
      }
    }

    if (lastAction.type === "archive") {
      unarchiveTodo(lastAction.todo.id);
    }

    setLastAction(null);
  }, [lastAction, setNotification, unarchiveTodo]);

  const clearCompleted = useCallback(async () => {
    const completedTodos = todos.filter((todo) => todo.completed);
    for (const todo of completedTodos) {
      await clearNotification(todo);
    }

    setTodos((current) => current.filter((todo) => !todo.completed));
  }, [clearNotification, todos]);

  const resetTodos = useCallback(async () => {
    for (const todo of todos) {
      await clearNotification(todo);
    }

    setTodos(starterTodos.map(normalizeTodo));
    setLastAction(null);
  }, [clearNotification, todos]);

  const stats = useMemo(() => {
    const activeTodos = todos.filter((todo) => !todo.archived);
    const completed = activeTodos.filter((todo) => todo.completed).length;
    const active = activeTodos.filter((todo) => !todo.completed).length;
    const archived = todos.filter((todo) => todo.archived).length;
    const highPriority = activeTodos.filter((todo) => !todo.completed && todo.priority === "high").length;
    const overdue = activeTodos.filter((todo) => {
      if (!todo.dueDate || todo.completed) {
        return false;
      }

      return new Date(`${todo.dueDate}T00:00:00`) < new Date(new Date().toDateString());
    }).length;

    const dueSoon = activeTodos.filter((todo) => {
      if (!todo.dueDate || todo.completed) {
        return false;
      }

      const due = new Date(`${todo.dueDate}T00:00:00`);
      const today = new Date();
      const diff = Math.round((due.getTime() - new Date(today.toDateString()).getTime()) / (24 * 60 * 60 * 1000));
      return diff >= 0 && diff <= 2;
    }).length;

    return { total: activeTodos.length, completed, active, archived, highPriority, overdue, dueSoon };
  }, [todos]);

  return {
    todos: sortTodos(todos),
    isLoading,
    stats,
    lastAction,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    archiveTodo,
    unarchiveTodo,
    undoLastTodoAction,
    clearCompleted,
    resetTodos,
  };
}

export function TodoProvider({ children }: { children: ReactNode }) {
  const value = useTodosState();

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}

export function useTodos() {
  const context = useContext(TodoContext);

  if (!context) {
    throw new Error("useTodos must be used within a TodoProvider");
  }

  return context;
}
