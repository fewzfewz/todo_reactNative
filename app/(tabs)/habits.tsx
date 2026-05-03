import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

const starterDraft: HabitDraft = {
  title: "",
  notes: "",
  color: "#3b82f6",
};

const colorOptions = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

const dayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const countStreak = (checkIns: string[]) => {
  const sorted = [...checkIns].sort();
  let streak = 0;
  let cursor = dayKey();

  while (sorted.includes(cursor)) {
    streak += 1;
    const next = new Date(`${cursor}T00:00:00`);
    next.setDate(next.getDate() - 1);
    cursor = dayKey(next);
  }

  return streak;
};

export default function HabitsScreen() {
  const { colors } = useTheme();
  const { habits, stats, isLoading, addHabit, updateHabit, deleteHabit, toggleCheckIn } = useHabits();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [draft, setDraft] = useState<HabitDraft>(starterDraft);

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
    });
    setModalVisible(true);
  };

  const submit = () => {
    const title = draft.title.trim();

    if (!title) {
      Alert.alert("Add a habit", "A habit needs a title before it can be saved.");
      return;
    }

    const payload = { ...draft, title };

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
      habits.map((habit) => ({
        ...habit,
        streak: countStreak(habit.checkIns),
        doneToday: habit.checkIns.includes(dayKey()),
      })),
    [habits],
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.textMuted }]}>Habits</Text>
            <Text style={[styles.title, { color: colors.text }]}>Build the routine</Text>
          </View>
          <Pressable
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
        </View>

        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.heroLabel, { color: colors.textMuted }]}>Daily rhythm</Text>
              <Text style={[styles.heroTitle, { color: colors.text }]}>
                {stats.completedToday > 0 ? `${stats.completedToday} habit(s) done today` : "Mark one habit today"}
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

        {habitCards.map((habit, index) => (
          <Animated.View key={habit.id} entering={FadeInDown.delay(index * 45).duration(300)}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <View style={[styles.colorChip, { backgroundColor: habit.color }]} />
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{habit.title}</Text>
                  {habit.notes ? <Text style={[styles.cardNotes, { color: colors.textMuted }]}>{habit.notes}</Text> : null}
                </View>
                <Pressable accessibilityLabel={`Edit ${habit.title}`} onPress={() => openEdit(habit)} style={styles.iconButton}>
                  <Ionicons color={colors.textMuted} name="create-outline" size={20} />
                </Pressable>
                <Pressable accessibilityLabel={`Delete ${habit.title}`} onPress={() => confirmDelete(habit)} style={styles.iconButton}>
                  <Ionicons color={colors.textMuted} name="trash-outline" size={20} />
                </Pressable>
              </View>

              <View style={styles.cardMeta}>
                <View style={[styles.pill, { backgroundColor: colors.bg }]}>
                  <Ionicons color={colors.primary} name="flame-outline" size={14} />
                  <Text style={[styles.pillText, { color: colors.textMuted }]}>{habit.streak} day streak</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: colors.bg }]}>
                  <Ionicons color={colors.success} name="calendar-outline" size={14} />
                  <Text style={[styles.pillText, { color: colors.textMuted }]}>{habit.checkIns.length} total</Text>
                </View>
                <Pressable
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
              </View>
            </View>
          </Animated.View>
        ))}

        {!habitCards.length && !isLoading ? (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <Ionicons color={colors.textMuted} name="leaf-outline" size={32} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No habits yet</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Add a habit and start checking it in every day.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingHabit ? "Edit habit" : "New habit"}
              </Text>
              <Pressable onPress={closeModal} style={styles.iconButton}>
                <Ionicons color={colors.textMuted} name="close" size={24} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <TextInput
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

              <Pressable onPress={submit} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: pressed ? 0.86 : 1 }]}>
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
  content: { padding: 20, paddingBottom: 120 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  eyebrow: { fontSize: 13, fontWeight: "800", textTransform: "uppercase" },
  title: { fontSize: 34, fontWeight: "800" },
  addButton: { alignItems: "center", borderRadius: 18, height: 54, justifyContent: "center", width: 54 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  metric: { borderRadius: 8, borderWidth: 1, flex: 1, padding: 14 },
  metricValue: { fontSize: 24, fontWeight: "800" },
  metricLabel: { fontSize: 12, fontWeight: "800", marginTop: 2, textTransform: "uppercase" },
  hero: { borderRadius: 8, borderWidth: 1, marginTop: 16, padding: 16 },
  heroTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  heroLabel: { fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  heroTitle: { fontSize: 20, fontWeight: "800", marginTop: 4 },
  loadingState: { alignItems: "center", borderRadius: 8, borderStyle: "dashed", borderWidth: 1, marginTop: 16, padding: 16 },
  loadingText: { fontSize: 14, fontWeight: "700" },
  card: { borderRadius: 8, borderWidth: 1, marginTop: 12, padding: 14 },
  cardTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  colorChip: { borderRadius: 999, height: 14, marginTop: 4, width: 14 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "800" },
  cardNotes: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  iconButton: { alignItems: "center", height: 28, justifyContent: "center", width: 28 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12, alignItems: "center" },
  pill: { alignItems: "center", borderRadius: 999, flexDirection: "row", gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { fontSize: 12, fontWeight: "700" },
  checkButton: { alignItems: "center", borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 6, marginLeft: "auto", paddingHorizontal: 12, paddingVertical: 8 },
  checkText: { fontSize: 12, fontWeight: "800" },
  emptyState: { alignItems: "center", borderRadius: 8, borderStyle: "dashed", borderWidth: 1, marginTop: 18, padding: 28 },
  emptyTitle: { fontSize: 18, fontWeight: "800", marginTop: 10 },
  emptyText: { fontSize: 14, lineHeight: 20, marginTop: 4, textAlign: "center" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  modalCard: { borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: "88%", padding: 20 },
  modalHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  modalTitle: { fontSize: 24, fontWeight: "800" },
  input: { borderRadius: 8, borderWidth: 1, fontSize: 16, marginBottom: 12, minHeight: 50, paddingHorizontal: 14, paddingVertical: 12 },
  notesInput: { minHeight: 96, textAlignVertical: "top" },
  fieldLabel: { fontSize: 12, fontWeight: "800", marginBottom: 8, marginTop: 4, textTransform: "uppercase" },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  colorOption: { borderRadius: 999, borderWidth: 2, height: 28, width: 28 },
  saveButton: { alignItems: "center", borderRadius: 8, flexDirection: "row", gap: 8, justifyContent: "center", paddingVertical: 14 },
  saveButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
});
