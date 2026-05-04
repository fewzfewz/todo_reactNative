import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { Habit, HabitDraft } from "@/types/habit";
import { buildHabitGroupSummaries, countHabitStreak } from "@/utils/habitTracker";
import { parseReminderInput } from "@/utils/date";
import { cancelReminder, scheduleReminder } from "@/utils/reminders";

const STORAGE_KEY = "habits:v2";

const starterHabits: Habit[] = [
  {
    id: "starter-habit-1",
    title: "Drink water",
    notes: "Mark it off at least once every day.",
    color: "#3b82f6",
    group: "Health",
    goalPerWeek: 7,
    reminderAt: null,
    notificationId: null,
    archived: false,
    archivedAt: null,
    checkIns: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "starter-habit-2",
    title: "Read for 15 minutes",
    notes: "A small habit that compounds quietly.",
    color: "#10b981",
    group: "Academics",
    goalPerWeek: 5,
    reminderAt: null,
    notificationId: null,
    archived: false,
    archivedAt: null,
    checkIns: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeHabit = (
  habit: Partial<Habit> &
    Pick<Habit, "id" | "title" | "notes" | "color" | "checkIns" | "createdAt" | "updatedAt">,
): Habit => ({
  ...habit,
  group: habit.group ?? "General",
  goalPerWeek: habit.goalPerWeek ?? 7,
  reminderAt: habit.reminderAt ?? null,
  notificationId: habit.notificationId ?? null,
  archived: habit.archived ?? false,
  archivedAt: habit.archivedAt ?? null,
  checkIns: habit.checkIns ?? [],
});

const dayKey = (value = new Date()) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const sortHabits = (habits: Habit[]) => [...habits].sort((a, b) => Number(a.archived) - Number(b.archived) || b.updatedAt.localeCompare(a.updatedAt));

type HabitContextType = ReturnType<typeof useHabitsState>;

type HabitAction =
  | { type: "delete"; habit: Habit }
  | { type: "archive"; habit: Habit };

const HabitContext = createContext<HabitContextType | undefined>(undefined);

function useHabitsState() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAction, setLastAction] = useState<HabitAction | null>(null);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!mounted) return;
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

  const setNotification = useCallback(async (habit: Habit) => {
    await cancelReminder(habit.notificationId);
    const notificationId = await scheduleReminder(
      habit.reminderAt,
      `Habit reminder: ${habit.title}`,
      habit.notes || "Open the app and check this one in.",
    );

    if (notificationId) {
      setHabits((current) =>
        current.map((item) => (item.id === habit.id ? { ...item, notificationId } : item)),
      );
    }
  }, []);

  const clearNotification = useCallback(async (habit: Habit) => {
    await cancelReminder(habit.notificationId);
  }, []);

  const addHabit = useCallback(
    async (draft: HabitDraft) => {
      const now = new Date().toISOString();
      const parsedReminder = parseReminderInput(draft.reminderAt);
      const habit: Habit = {
        id: createId(),
        title: draft.title.trim(),
        notes: draft.notes.trim(),
        color: draft.color,
        group: draft.group.trim() || "General",
        goalPerWeek: Math.max(1, draft.goalPerWeek || 7),
        reminderAt: parsedReminder ? parsedReminder.toISOString() : null,
        notificationId: null,
        archived: false,
        archivedAt: null,
        checkIns: [],
        createdAt: now,
        updatedAt: now,
      };

      setHabits((current) => sortHabits([habit, ...current]));
      await setNotification(habit);
    },
    [setNotification],
  );

  const updateHabit = useCallback(
    async (id: string, draft: HabitDraft) => {
      const existing = habits.find((habit) => habit.id === id);
      if (!existing) {
        return;
      }

      const parsedReminder = parseReminderInput(draft.reminderAt);
      const nextHabit: Habit = {
        ...existing,
        title: draft.title.trim(),
        notes: draft.notes.trim(),
        color: draft.color,
        group: draft.group.trim() || "General",
        goalPerWeek: Math.max(1, draft.goalPerWeek || 7),
        reminderAt: parsedReminder ? parsedReminder.toISOString() : null,
        updatedAt: new Date().toISOString(),
      };

      setHabits((current) => sortHabits(current.map((habit) => (habit.id === id ? nextHabit : habit))));
      await setNotification(nextHabit);
    },
    [habits, setNotification],
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      const existing = habits.find((habit) => habit.id === id);
      if (!existing) return;

      setLastAction({ type: "delete", habit: existing });
      setHabits((current) => current.filter((habit) => habit.id !== id));
      await clearNotification(existing);
    },
    [clearNotification, habits],
  );

  const archiveHabit = useCallback(
    async (id: string) => {
      const existing = habits.find((habit) => habit.id === id);
      if (!existing) return;

      const archivedHabit = {
        ...existing,
        archived: true,
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setLastAction({ type: "archive", habit: existing });
      setHabits((current) => sortHabits(current.map((habit) => (habit.id === id ? archivedHabit : habit))));
      await clearNotification(existing);
    },
    [clearNotification, habits],
  );

  const unarchiveHabit = useCallback((id: string) => {
    setHabits((current) =>
      sortHabits(
        current.map((habit) =>
          habit.id === id
            ? {
                ...habit,
                archived: false,
                archivedAt: null,
                updatedAt: new Date().toISOString(),
              }
            : habit,
        ),
      ),
    );
  }, []);

  const undoLastHabitAction = useCallback(() => {
    if (!lastAction) return;

    if (lastAction.type === "delete") {
      setHabits((current) => sortHabits([lastAction.habit, ...current]));
      if (lastAction.habit.reminderAt) {
        void setNotification(lastAction.habit);
      }
    }

    if (lastAction.type === "archive") {
      unarchiveHabit(lastAction.habit.id);
    }

    setLastAction(null);
  }, [lastAction, setNotification, unarchiveHabit]);

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

  const resetHabits = useCallback(async () => {
    for (const habit of habits) {
      await clearNotification(habit);
    }

    setHabits(starterHabits.map(normalizeHabit));
    setLastAction(null);
  }, [clearNotification, habits]);

  const todayKey = dayKey();

  const stats = useMemo(() => {
    const activeHabits = habits.filter((habit) => !habit.archived);
    const completedToday = activeHabits.filter((habit) => habit.checkIns.includes(todayKey)).length;
    const totalCheckIns = activeHabits.reduce((sum, habit) => sum + habit.checkIns.length, 0);
    const archived = habits.filter((habit) => habit.archived).length;
    const activeGroups = new Set(activeHabits.map((habit) => habit.group.trim() || "General")).size;

    return {
      total: activeHabits.length,
      active: activeHabits.length,
      archived,
      completedToday,
      totalCheckIns,
      activeGroups,
      streakHabits: activeHabits.filter((habit) => habit.checkIns.length > 0).length,
    };
  }, [habits, todayKey]);

  const groups = useMemo(() => buildHabitGroupSummaries(habits), [habits]);
  const habitLookup = useMemo(
    () => new Map(habits.map((habit) => [habit.id, { ...habit, streak: countHabitStreak(habit.checkIns) }])),
    [habits],
  );

  return {
    habits: sortHabits(habits),
    isLoading,
    stats,
    groups,
    habitLookup,
    lastAction,
    addHabit,
    updateHabit,
    deleteHabit,
    archiveHabit,
    unarchiveHabit,
    undoLastHabitAction,
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
