import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import useTheme from "@/hooks/useTheme";
import { useHabits } from "@/hooks/useHabits";
import { Habit, HabitDraft } from "@/types/habit";
import { parseReminderInput, toReminderInput } from "@/utils/date";
import { buildHabitWeekSeries, countHabitStreak } from "@/utils/habitTracker";

const starterDraft: HabitDraft = {
  title: "",
  notes: "",
  color: "#3b82f6",
  group: "Health",
  goalPerWeek: 7,
  reminderAt: "",
};

const colorOptions = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];
const starterGroups = ["Health", "Academics", "Work", "Fitness", "Mindfulness", "Creative"];

const dayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function HabitsScreen() {
  const { colors } = useTheme();
  const {
    habits,
    stats,
    isLoading,
    addHabit,
    updateHabit,
    deleteHabit,
    archiveHabit,
    undoLastHabitAction,
    lastAction,
    toggleCheckIn,
  } = useHabits();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [draft, setDraft] = useState<HabitDraft>(starterDraft);

  const groupChoices = useMemo(() => {
    const current = new Set(
      habits.map((habit) => habit.group.trim()).filter(Boolean),
    );
    return [...new Set([...starterGroups, ...current])];
  }, [habits]);

  const closeModal = () => {
    setModalVisible(false);
    setEditingHabit(null);
    setDraft(starterDraft);
  };

  const openCreate = () => {
    setEditingHabit(null);
    setDraft(starterDraft);
    setModalVisible(true);
  };

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setDraft({
      title: habit.title,
      notes: habit.notes,
      color: habit.color,
      group: habit.group,
      goalPerWeek: habit.goalPerWeek,
      reminderAt: toReminderInput(habit.reminderAt),
    });
    setModalVisible(true);
  };

  const submit = () => {
    const title = draft.title.trim();

    if (!title) {
      Alert.alert("Add a habit", "A habit needs a title before it can be saved.");
      return;
    }

    if (!draft.group.trim()) {
      Alert.alert("Choose a group", "Pick or type a group such as Health or Academics.");
      return;
    }

    if (draft.reminderAt.trim() && !parseReminderInput(draft.reminderAt)) {
      Alert.alert("Check the reminder", "Use YYYY-MM-DD HH:MM, like 2026-05-04 18:30.");
      return;
    }

    const payload = { ...draft, title, group: draft.group.trim() };

    if (editingHabit) {
      updateHabit(editingHabit.id, payload);
    } else {
      addHabit(payload);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeModal();
  };

  const confirmDelete = (habit: Habit) => {
    Alert.alert("Delete habit?", habit.title, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteHabit(habit.id),
      },
    ]);
  };

  const habitCards = useMemo(
    () =>
      habits
        .filter((habit) => !habit.archived)
        .map((habit) => ({
          ...habit,
          streak: countHabitStreak(habit.checkIns),
          doneToday: habit.checkIns.includes(dayKey()),
          weekSeries: buildHabitWeekSeries(habit),
        })),
    [habits],
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: colors.textMuted }]}>Habits</Text>
            <Text style={[styles.title, { color: colors.text }]}>Build the routine</Text>
          </View>
          <Pressable
            accessibilityLabel="Add habit"
            onPress={openCreate}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.86 : 1 },
            ]}
          >
            <Ionicons color="#ffffff" name="add" size={28} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <Metric label="Habits" value={stats.total} color={colors.primary} />
          <Metric label="Today" value={stats.completedToday} color={colors.success} />
          <Metric label="Check-ins" value={stats.totalCheckIns} color={colors.warning} />
          <Metric label="Groups" value={stats.activeGroups} color={colors.textMuted} />
        </View>

        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={[styles.heroLabel, { color: colors.textMuted }]}>Daily rhythm</Text>
              <Text style={[styles.heroTitle, { color: colors.text }]}>
                {stats.completedToday > 0 ? `${stats.completedToday} habit(s) done today` : "Mark one habit today"}
              </Text>
              <Text style={[styles.heroHint, { color: colors.textMuted }]}>
                Tap a habit card to open its own tracker table and history.
              </Text>
            </View>
            <Ionicons color={colors.primary} name="leaf-outline" size={22} />
          </View>
        </View>

        {isLoading ? (
          <View style={[styles.loadingState, { borderColor: colors.border }]}>
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading habits</Text>
          </View>
        ) : null}

        {lastAction ? (
          <View style={[styles.undoBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.undoText, { color: colors.text }]}>Action saved</Text>
            <Pressable onPress={undoLastHabitAction} style={styles.undoButton}>
              <Text style={[styles.undoButtonText, { color: colors.primary }]}>Undo</Text>
            </Pressable>
          </View>
        ) : null}

        {habitCards.map((habit, index) => (
          <Animated.View key={habit.id} entering={FadeInDown.delay(index * 45).duration(300)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${habit.title} tracker`}
              onPress={() => router.push({ pathname: "/habits/[id]", params: { id: habit.id } })}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.95 : 1,
                },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={[styles.colorChip, { backgroundColor: habit.color }]} />
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{habit.title}</Text>
                  {habit.notes ? <Text style={[styles.cardNotes, { color: colors.textMuted }]}>{habit.notes}</Text> : null}
                </View>
                <Pressable
                  accessibilityLabel={`Edit ${habit.title}`}
                  hitSlop={8}
                  onPress={() => openEdit(habit)}
                  style={styles.iconButton}
                >
                  <Ionicons color={colors.textMuted} name="create-outline" size={20} />
                </Pressable>
                <Pressable
                  accessibilityLabel={`Delete ${habit.title}`}
                  hitSlop={8}
                  onPress={() => confirmDelete(habit)}
                  style={styles.iconButton}
                >
                  <Ionicons color={colors.textMuted} name="trash-outline" size={20} />
                </Pressable>
              </View>

              <View style={styles.cardMeta}>
                <View style={[styles.pill, { backgroundColor: colors.bg }]}>
                  <Ionicons color={colors.primary} name="people-outline" size={14} />
                  <Text style={[styles.pillText, { color: colors.textMuted }]}>{habit.group}</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: colors.bg }]}>
                  <Ionicons color={colors.primary} name="flame-outline" size={14} />
                  <Text style={[styles.pillText, { color: colors.textMuted }]}>{habit.streak} day streak</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: colors.bg }]}>
                  <Ionicons color={colors.success} name="calendar-outline" size={14} />
                  <Text style={[styles.pillText, { color: colors.textMuted }]}>{habit.checkIns.length} total</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: colors.bg }]}>
                  <Ionicons color={colors.warning} name="flag-outline" size={14} />
                  <Text style={[styles.pillText, { color: colors.textMuted }]}>{habit.goalPerWeek}/week</Text>
                </View>
              </View>

              <View style={styles.timelineRow}>
                {habit.weekSeries.map((day) => (
                  <View
                    key={day.date}
                    style={[
                      styles.timelineCell,
                      {
                        backgroundColor: day.checkIns ? habit.color : colors.bg,
                        borderColor: day.checkIns ? habit.color : colors.border,
                      },
                    ]}
                  />
                ))}
                <Text style={[styles.timelineLabel, { color: colors.textMuted }]}>
                  {habit.doneToday ? "Tracked today" : "Needs a check-in"}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Pressable
                  accessibilityLabel={habit.doneToday ? `Undo check in for ${habit.title}` : `Check in ${habit.title}`}
                  onPress={() => {
                    toggleCheckIn(habit.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={({ pressed }) => [
                    styles.checkButton,
                    {
                      backgroundColor: habit.doneToday ? colors.success : colors.bg,
                      borderColor: habit.doneToday ? colors.success : colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Ionicons color={habit.doneToday ? "#ffffff" : colors.textMuted} name={habit.doneToday ? "checkmark" : "ellipse-outline"} size={16} />
                  <Text style={[styles.checkText, { color: habit.doneToday ? "#ffffff" : colors.text }]}>
                    {habit.doneToday ? "Done today" : "Check in"}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={`Archive ${habit.title}`}
                  onPress={() => archiveHabit(habit.id)}
                  style={[styles.archiveButton, { borderColor: colors.border, backgroundColor: colors.bg }]}
                >
                  <Ionicons color={colors.textMuted} name="archive-outline" size={16} />
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        ))}

        {!habitCards.length && !isLoading ? (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <Ionicons color={colors.textMuted} name="leaf-outline" size={32} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No habits yet</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Add a habit, assign a group, and track it daily from its own page.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingHabit ? "Edit habit" : "New habit"}
              </Text>
              <Pressable accessibilityLabel="Close" onPress={closeModal} style={styles.iconButton}>
                <Ionicons color={colors.textMuted} name="close" size={24} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <TextInput
                autoFocus
                placeholder="Habit title"
                placeholderTextColor={colors.textMuted}
                value={draft.title}
                onChangeText={(title) => setDraft((current) => ({ ...current, title }))}
                style={[
                  styles.input,
                  { backgroundColor: colors.backgrounds.input, borderColor: colors.border, color: colors.text },
                ]}
              />
              <TextInput
                multiline
                placeholder="Notes"
                placeholderTextColor={colors.textMuted}
                value={draft.notes}
                onChangeText={(notes) => setDraft((current) => ({ ...current, notes }))}
                style={[
                  styles.input,
                  styles.notesInput,
                  { backgroundColor: colors.backgrounds.input, borderColor: colors.border, color: colors.text },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Group</Text>
              <TextInput
                placeholder="Academics, Health, Work..."
                placeholderTextColor={colors.textMuted}
                value={draft.group}
                onChangeText={(group) => setDraft((current) => ({ ...current, group }))}
                style={[
                  styles.input,
                  { backgroundColor: colors.backgrounds.input, borderColor: colors.border, color: colors.text },
                ]}
              />
              <View style={styles.chipRow}>
                {groupChoices.map((group) => (
                  <Pressable
                    key={group}
                    onPress={() => setDraft((current) => ({ ...current, group }))}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: draft.group === group ? colors.primary : colors.bg,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: draft.group === group ? "#ffffff" : colors.text }]}>
                      {group}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                keyboardType="number-pad"
                placeholder="Goal per week"
                placeholderTextColor={colors.textMuted}
                value={String(draft.goalPerWeek)}
                onChangeText={(goalPerWeek) =>
                  setDraft((current) => ({ ...current, goalPerWeek: Number(goalPerWeek) || 1 }))
                }
                style={[
                  styles.input,
                  { backgroundColor: colors.backgrounds.input, borderColor: colors.border, color: colors.text },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Color</Text>
              <View style={styles.colorRow}>
                {colorOptions.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => setDraft((current) => ({ ...current, color }))}
                    style={[
                      styles.colorOption,
                      {
                        borderColor: draft.color === color ? colors.text : colors.border,
                        backgroundColor: color,
                      },
                    ]}
                  />
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Reminder</Text>
              <TextInput
                placeholder="YYYY-MM-DD HH:MM"
                placeholderTextColor={colors.textMuted}
                value={draft.reminderAt}
                onChangeText={(reminderAt) => setDraft((current) => ({ ...current, reminderAt }))}
                style={[
                  styles.input,
                  { backgroundColor: colors.backgrounds.input, borderColor: colors.border, color: colors.text },
                ]}
              />

              <Pressable
                onPress={submit}
                style={({ pressed }) => [
                  styles.saveButton,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.86 : 1 },
                ]}
              >
                <Ionicons color="#ffffff" name="save-outline" size={18} />
                <Text style={styles.saveButtonText}>{editingHabit ? "Save changes" : "Create habit"}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.metric, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: 12 },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 13, fontWeight: "800", textTransform: "uppercase" },
  title: { fontSize: 32, fontWeight: "800" },
  addButton: { alignItems: "center", borderRadius: 18, height: 54, justifyContent: "center", width: 54 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
  metric: { borderRadius: 8, borderWidth: 1, flexBasis: "48%", padding: 14 },
  metricValue: { fontSize: 24, fontWeight: "800" },
  metricLabel: { fontSize: 12, fontWeight: "800", marginTop: 2, textTransform: "uppercase" },
  hero: { borderRadius: 8, borderWidth: 1, marginTop: 16, padding: 16 },
  heroTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: 12 },
  heroCopy: { flex: 1, minWidth: 0 },
  heroLabel: { fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  heroTitle: { fontSize: 18, fontWeight: "800", marginTop: 4 },
  heroHint: { fontSize: 13, lineHeight: 18, marginTop: 6 },
  loadingState: { alignItems: "center", borderRadius: 8, borderStyle: "dashed", borderWidth: 1, marginTop: 16, padding: 16 },
  loadingText: { fontSize: 14, fontWeight: "700" },
  undoBanner: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  undoText: { fontSize: 14, fontWeight: "700" },
  undoButton: { paddingHorizontal: 8, paddingVertical: 4 },
  undoButtonText: { fontSize: 14, fontWeight: "800" },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  cardTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  colorChip: { borderRadius: 999, height: 14, marginTop: 4, width: 14 },
  cardText: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 17, fontWeight: "800" },
  cardNotes: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  iconButton: { alignItems: "center", height: 28, justifyContent: "center", width: 28 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  pill: { alignItems: "center", borderRadius: 999, flexDirection: "row", gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { fontSize: 12, fontWeight: "700" },
  timelineRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  timelineCell: { borderRadius: 999, borderWidth: 1, height: 10, width: 10 },
  timelineLabel: { fontSize: 12, fontWeight: "700", marginLeft: 4 },
  cardFooter: { alignItems: "center", flexDirection: "row", gap: 10, marginTop: 14 },
  checkButton: { alignItems: "center", borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 6, flex: 1, justifyContent: "center", paddingHorizontal: 12, paddingVertical: 10 },
  checkText: { fontSize: 12, fontWeight: "800" },
  archiveButton: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  emptyState: {
    alignItems: "center",
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    marginTop: 18,
    padding: 28,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", marginTop: 10 },
  emptyText: { fontSize: 14, lineHeight: 20, marginTop: 4, textAlign: "center" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  modalCard: { borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: "88%", padding: 20 },
  modalHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  modalTitle: { fontSize: 24, fontWeight: "800" },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 12,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notesInput: { minHeight: 96, textAlignVertical: "top" },
  fieldLabel: { fontSize: 12, fontWeight: "800", marginBottom: 8, marginTop: 4, textTransform: "uppercase" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { fontSize: 12, fontWeight: "800" },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  colorOption: { borderRadius: 999, borderWidth: 2, height: 28, width: 28 },
  saveButton: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 14,
  },
  saveButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
});
