import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { Todo, TodoDraft } from "@/types/todo";

const STORAGE_KEY = "todos:v1";

const starterTodos: Todo[] = [
  {
    id: "starter-1",
    title: "Plan the day",
    notes: "Pick the three tasks that would make today feel successful.",
    priority: "high",
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
    completed: false,
    completedAt: null,
    dueDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const sortTodos = (todos: Todo[]) => {
  const priorityWeight = { high: 0, medium: 1, low: 2 };

  return [...todos].sort((a, b) => {
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

const normalizeTodo = (todo: Partial<Todo> & Pick<Todo, "id" | "title" | "notes" | "priority" | "completed" | "dueDate" | "createdAt" | "updatedAt">): Todo => ({
  ...todo,
  completedAt: todo.completedAt ?? null,
});

type TodoContextType = ReturnType<typeof useTodosState>;

const TodoContext = createContext<TodoContextType | undefined>(undefined);

function useTodosState() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const addTodo = useCallback((draft: TodoDraft) => {
    const now = new Date().toISOString();
    const todo: Todo = {
      id: createId(),
      title: draft.title.trim(),
      notes: draft.notes.trim(),
      priority: draft.priority,
      dueDate: draft.dueDate,
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    setTodos((current) => sortTodos([todo, ...current]));
  }, []);

  const updateTodo = useCallback((id: string, draft: TodoDraft) => {
    setTodos((current) =>
      sortTodos(
        current.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                title: draft.title.trim(),
                notes: draft.notes.trim(),
                priority: draft.priority,
                dueDate: draft.dueDate,
                updatedAt: new Date().toISOString(),
              }
            : todo,
        ),
      ),
    );
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos((current) =>
      sortTodos(
        current.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                completed: !todo.completed,
                completedAt: !todo.completed ? new Date().toISOString() : null,
                updatedAt: new Date().toISOString(),
              }
            : todo,
        ),
      ),
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((current) => current.filter((todo) => todo.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setTodos((current) => current.filter((todo) => !todo.completed));
  }, []);

  const resetTodos = useCallback(() => {
    setTodos(starterTodos.map(normalizeTodo));
  }, []);

  const stats = useMemo(() => {
    const completed = todos.filter((todo) => todo.completed).length;
    const active = todos.length - completed;
    const highPriority = todos.filter((todo) => !todo.completed && todo.priority === "high").length;
    const overdue = todos.filter((todo) => {
      if (!todo.dueDate || todo.completed) {
        return false;
      }

      return new Date(`${todo.dueDate}T00:00:00`) < new Date(new Date().toDateString());
    }).length;

    return { total: todos.length, completed, active, highPriority, overdue };
  }, [todos]);

  return {
    todos: sortTodos(todos),
    isLoading,
    stats,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
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
