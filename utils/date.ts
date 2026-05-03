const dayMs = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
};

export const addMonths = (months: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return toDateInputValue(date);
};

export const isValidDateInput = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && toDateInputValue(date) === value;
};

export const getDueStatus = (dueDate: string | null, completed: boolean) => {
  if (!dueDate) {
    return { label: "No date", tone: "muted" as const };
  }

  const today = startOfDay(new Date());
  const due = startOfDay(new Date(`${dueDate}T00:00:00`));
  const days = Math.round((due.getTime() - today.getTime()) / dayMs);

  if (completed) {
    return { label: "Done", tone: "success" as const };
  }

  if (days < 0) {
    return { label: "Overdue", tone: "danger" as const };
  }

  if (days === 0) {
    return { label: "Today", tone: "warning" as const };
  }

  if (days === 1) {
    return { label: "Tomorrow", tone: "primary" as const };
  }

  return { label: due.toLocaleDateString(undefined, { month: "short", day: "numeric" }), tone: "muted" as const };
};

export const shiftDateByRepeat = (date: string | null, repeat: "none" | "daily" | "weekly" | "monthly") => {
  if (!date || repeat === "none") {
    return null;
  }

  const next = new Date(`${date}T00:00:00`);

  if (repeat === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (repeat === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (repeat === "monthly") {
    next.setMonth(next.getMonth() + 1);
  }

  return toDateInputValue(next);
};

export const parseReminderInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}):(\d{2}))?$/,
  );

  if (!match) {
    return null;
  }

  const [, datePart, hourPart = "08", minutePart = "00"] = match;
  const candidate = new Date(`${datePart}T${hourPart}:${minutePart}:00`);

  if (Number.isNaN(candidate.getTime())) {
    return null;
  }

  return candidate;
};

export const toReminderInput = (date: string | null) => {
  if (!date) {
    return "";
  }

  const parsed = new Date(date);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hour = String(parsed.getHours()).padStart(2, "0");
  const minute = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}`;
};
