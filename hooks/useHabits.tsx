import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { Habit, HabitDraft } from "@/types/habit";

const STORAGE_KEY = "habits:v1";

const starterHabits: Habit[] = [
  {
    id: "starter-habit-1",
    title: "Drink water",
    notes: "Mark it off at least once every day.",
    color: "#3b82f6",
    checkIns: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "starter-habit-2",
    title: "Read for 15 minutes",
    notes: "A small habit that compounds quietly.",
    color: "#10b981",
    checkIns: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeHabit = (habit: Partial<Habit> & Pick<Habit, "id" | "title" | "notes" | "color" | "checkIns" | "createdAt" | "updatedAt">): Habit => ({
  ...habit,
  checkIns: habit.checkIns ?? [],
});

const dayKey = (value = new Date()) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const sortHabits = (habits: Habit[]) =>
  [...habits].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

type HabitContextType = ReturnType<typeof useHabitsState>;

const HabitContext = createContext<HabitContextType | undefined>(undefined);

function useHabitsState() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!mounted) {
          return;
        }

        setHabits(stored ? JSON.parse(stored).map(normalizeHabit) : starterHabits);
      })
      .catch(() => {
        if (mounted) {
          setHabits(starterHabits);
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
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    }
  }, [habits, isLoading]);

  const addHabit = useCallback((draft: HabitDraft) => {
    const now = new Date().toISOString();
    const habit: Habit = {
      id: createId(),
      title: draft.title.trim(),
      notes: draft.notes.trim(),
      color: draft.color,
      checkIns: [],
      createdAt: now,
      updatedAt: now,
    };

    setHabits((current) => sortHabits([habit, ...current]));
  }, []);

  const updateHabit = useCallback((id: string, draft: HabitDraft) => {
    setHabits((current) =>
      sortHabits(
        current.map((habit) =>
          habit.id === id
            ? {
                ...habit,
                title: draft.title.trim(),
                notes: draft.notes.trim(),
                color: draft.color,
                updatedAt: new Date().toISOString(),
              }
            : habit,
        ),
      ),
    );
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setHabits((current) => current.filter((habit) => habit.id !== id));
  }, []);

  const toggleCheckIn = useCallback((id: string, date: Date = new Date()) => {
    const key = dayKey(date);

    setHabits((current) =>
      sortHabits(
        current.map((habit) =>
          habit.id === id
            ? {
                ...habit,
                checkIns: habit.checkIns.includes(key)
                  ? habit.checkIns.filter((item) => item !== key)
                  : [...habit.checkIns, key],
                updatedAt: new Date().toISOString(),
              }
            : habit,
        ),
      ),
    );
  }, []);

  const resetHabits = useCallback(() => {
    setHabits(starterHabits.map(normalizeHabit));
  }, []);

  const todayKey = dayKey();

  const stats = useMemo(() => {
    const completedToday = habits.filter((habit) => habit.checkIns.includes(todayKey)).length;
    const active = habits.length;
    const totalCheckIns = habits.reduce((sum, habit) => sum + habit.checkIns.length, 0);

    return {
      total: habits.length,
      active,
      completedToday,
      totalCheckIns,
      streakHabits: habits.filter((habit) => habit.checkIns.length > 0).length,
    };
  }, [habits, todayKey]);

  return {
    habits: sortHabits(habits),
    isLoading,
    stats,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleCheckIn,
    resetHabits,
  };
}

export function HabitProvider({ children }: { children: ReactNode }) {
  const value = useHabitsState();

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
}

export function useHabits() {
  const context = useContext(HabitContext);

  if (!context) {
    throw new Error("useHabits must be used within a HabitProvider");
  }

  return context;
}
