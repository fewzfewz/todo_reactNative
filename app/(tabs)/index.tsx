import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
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
import { SafeAreaView } from "react-native-safe-area-context";

import useTheme from "@/hooks/useTheme";
import { useTodos } from "@/hooks/useTodos";
import { Todo, TodoDraft, TodoFilter, TodoPriority } from "@/types/todo";
import { addDays, getDueStatus, isValidDateInput } from "@/utils/date";
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const priorities: TodoPriority[] = ["low", "medium", "high"];
const filters: TodoFilter[] = ["all", "active", "completed"];

const emptyDraft: TodoDraft = {
  title: "",
  notes: "",
  priority: "medium",
  dueDate: null,
};

export default function Index() {
  const { colors } = useTheme();
  const { todos, stats, isLoading, addTodo, updateTodo, toggleTodo, deleteTodo } = useTodos();
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [query, setQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [draft, setDraft] = useState<TodoDraft>(emptyDraft);
  const [dateInput, setDateInput] = useState("");

  const filteredTodos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return todos.filter((todo) => {
      const matchesFilter =
        filter === "all" || (filter === "active" ? !todo.completed : todo.completed);
      const matchesQuery =
        !normalizedQuery ||
        todo.title.toLowerCase().includes(normalizedQuery) ||
        todo.notes.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [filter, query, todos]);

  const openCreateModal = () => {
    setEditingTodo(null);
    setDraft(emptyDraft);
    setDateInput("");
    setModalVisible(true);
  };

  const openEditModal = (todo: Todo) => {
    setEditingTodo(todo);
    setDraft({
      title: todo.title,
      notes: todo.notes,
      priority: todo.priority,
      dueDate: todo.dueDate,
    });
    setDateInput(todo.dueDate ?? "");
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingTodo(null);
    setDraft(emptyDraft);
    setDateInput("");
  };

  const submitDraft = () => {
    const title = draft.title.trim();
    const cleanDate = dateInput.trim();

    if (!title) {
      Alert.alert("Add a title", "A task needs a short title before it can be saved.");
      return;
    }

    if (cleanDate && !isValidDateInput(cleanDate)) {
      Alert.alert("Check the date", "Use the YYYY-MM-DD format, like 2026-05-04.");
      return;
    }

    const payload = { ...draft, title, dueDate: cleanDate || null };

    if (editingTodo) {
      updateTodo(editingTodo.id, payload);
    } else {
      addTodo(payload);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeModal();
  };

  const confirmDelete = (todo: Todo) => {
    Alert.alert("Delete task?", todo.title, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteTodo(todo.id),
      },
    ]);
  };

  const renderTodo = ({ item, index }: { item: Todo; index: number }) => {
    const due = getDueStatus(item.dueDate, item.completed);
    const priorityTone = {
      low: colors.success,
      medium: colors.warning,
      high: colors.danger,
    }[item.priority];

    return (
      <Animated.View entering={FadeInDown.delay(index * 40).duration(320)}>
        <Pressable
          onPress={() => openEditModal(item)}
          style={({ pressed }) => [
            styles.todoCard,
            {
              backgroundColor: colors.surface,
              borderColor: item.completed ? colors.border : priorityTone,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.completed }}
          onPress={() => {
            toggleTodo(item.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={[
            styles.checkButton,
            {
              backgroundColor: item.completed ? colors.success : "transparent",
              borderColor: item.completed ? colors.success : colors.border,
            },
          ]}
        >
          {item.completed ? <Ionicons color="#ffffff" name="checkmark" size={18} /> : null}
        </Pressable>

        <View style={styles.todoContent}>
          <View style={styles.todoHeader}>
            <Text
              numberOfLines={2}
              style={[
                styles.todoTitle,
                { color: colors.text, textDecorationLine: item.completed ? "line-through" : "none" },
              ]}
            >
              {item.title}
            </Text>
            <Pressable
              accessibilityLabel={`Delete ${item.title}`}
              hitSlop={10}
              onPress={() => confirmDelete(item)}
              style={styles.iconButton}
            >
              <Ionicons color={colors.textMuted} name="trash-outline" size={20} />
            </Pressable>
          </View>

          {item.notes ? (
            <Text numberOfLines={2} style={[styles.todoNotes, { color: colors.textMuted }]}>
              {item.notes}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={[styles.pill, { backgroundColor: `${priorityTone}22` }]}>
              <View style={[styles.priorityDot, { backgroundColor: priorityTone }]} />
              <Text style={[styles.pillText, { color: priorityTone }]}>{item.priority}</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: colors.bg }]}>
              <Ionicons
                color={
                  due.tone === "danger"
                    ? colors.danger
                    : due.tone === "warning"
                      ? colors.warning
                      : due.tone === "success"
                        ? colors.success
                        : colors.textMuted
                }
                name="calendar-outline"
                size={14}
              />
              <Text style={[styles.pillText, { color: colors.textMuted }]}>{due.label}</Text>
            </View>
          </View>
        </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>Today</Text>
          <Text style={[styles.title, { color: colors.text }]}>Focus List</Text>
        </View>
        <Pressable
          accessibilityLabel="Add task"
          onPress={openCreateModal}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons color="#ffffff" name="add" size={28} />
        </Pressable>
      </View>

      <FocusDeck colors={colors} stats={stats} />

      <View style={styles.statsRow}>
        <Stat label="Active" value={stats.active} color={colors.primary} />
        <Stat label="Done" value={stats.completed} color={colors.success} />
        <Stat label="Urgent" value={stats.highPriority} color={colors.danger} />
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons color={colors.textMuted} name="search" size={18} />
        <TextInput
          placeholder="Search tasks"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          style={[styles.searchInput, { color: colors.text }]}
        />
        {query ? (
          <Pressable accessibilityLabel="Clear search" onPress={() => setQuery("")}>
            <Ionicons color={colors.textMuted} name="close-circle" size={18} />
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.segmented, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {filters.map((item) => (
          <Pressable
            key={item}
            onPress={() => setFilter(item)}
            style={[
              styles.segment,
              { backgroundColor: filter === item ? colors.primary : "transparent" },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: filter === item ? "#ffffff" : colors.textMuted },
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredTodos}
        keyExtractor={(item) => item.id}
        renderItem={renderTodo}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <Ionicons color={colors.textMuted} name="sparkles-outline" size={30} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {isLoading ? "Loading tasks" : "Nothing here yet"}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Add a task or adjust your filters to bring your list back into view.
            </Text>
          </View>
        }
      />

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingTodo ? "Edit task" : "New task"}
              </Text>
              <Pressable accessibilityLabel="Close modal" onPress={closeModal} style={styles.iconButton}>
                <Ionicons color={colors.textMuted} name="close" size={24} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <TextInput
                autoFocus
                placeholder="Task title"
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

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Priority</Text>
              <View style={styles.choiceRow}>
                {priorities.map((priority) => (
                  <Pressable
                    key={priority}
                    onPress={() => setDraft((current) => ({ ...current, priority }))}
                    style={[
                      styles.choice,
                      {
                        backgroundColor: draft.priority === priority ? colors.primary : colors.bg,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        { color: draft.priority === priority ? "#ffffff" : colors.text },
                      ]}
                    >
                      {priority}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Due date</Text>
              <TextInput
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                value={dateInput}
                onChangeText={setDateInput}
                style={[
                  styles.input,
                  { backgroundColor: colors.backgrounds.input, borderColor: colors.border, color: colors.text },
                ]}
              />
              <View style={styles.choiceRow}>
                <DateChip label="Today" onPress={() => setDateInput(addDays(0))} />
                <DateChip label="Tomorrow" onPress={() => setDateInput(addDays(1))} />
                <DateChip label="No date" onPress={() => setDateInput("")} />
              </View>

              <Pressable
                onPress={submitDraft}
                style={({ pressed }) => [
                  styles.saveButton,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.86 : 1 },
                ]}
              >
                <Ionicons color="#ffffff" name="save-outline" size={20} />
                <Text style={styles.saveButtonText}>{editingTodo ? "Save changes" : "Create task"}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function DateChip({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.dateChip, { backgroundColor: colors.bg, borderColor: colors.border }]}
    >
      <Text style={[styles.dateChipText, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function FocusDeck({
  colors,
  stats,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
  stats: { active: number; completed: number; highPriority: number };
}) {
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 6000 }), -1, true);
  }, [spin]);

  const deckStyle = useAnimatedStyle(() => {
    const tiltX = interpolate(spin.value, [0, 1], [10, -10]);
    const tiltY = interpolate(spin.value, [0, 1], [-14, 14]);
    const lift = interpolate(spin.value, [0, 1], [0, -5]);

    return {
      transform: [
        { perspective: 900 },
        { rotateX: `${tiltX}deg` },
        { rotateY: `${tiltY}deg` },
        { translateY: lift },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.focusDeck, { backgroundColor: colors.surface, borderColor: colors.border }, deckStyle]}
    >
      <View style={styles.focusDeckTop}>
        <View>
          <Text style={[styles.focusDeckLabel, { color: colors.textMuted }]}>3D focus board</Text>
          <Text style={[styles.focusDeckTitle, { color: colors.text }]}>Daily momentum</Text>
        </View>
        <View style={[styles.focusDeckBadge, { backgroundColor: colors.primary }]} />
      </View>

      <View style={styles.focusDeckStats}>
        <DeckMetric
          label="Active"
          value={stats.active}
          color={colors.primary}
          textColor={colors.text}
          mutedColor={colors.textMuted}
        />
        <DeckMetric
          label="Done"
          value={stats.completed}
          color={colors.success}
          textColor={colors.text}
          mutedColor={colors.textMuted}
        />
        <DeckMetric
          label="Urgent"
          value={stats.highPriority}
          color={colors.danger}
          textColor={colors.text}
          mutedColor={colors.textMuted}
        />
      </View>

      <View style={styles.focusDeckRail}>
        <View
          style={[
            styles.focusDeckRailFill,
            {
              width: `${Math.max(
                12,
                (stats.completed / Math.max(1, stats.active + stats.completed)) * 100,
              )}%`,
              backgroundColor: colors.success,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

function DeckMetric({
  label,
  value,
  color,
  textColor,
  mutedColor,
}: {
  label: string;
  value: number;
  color: string;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <View style={styles.deckMetric}>
      <View style={[styles.deckMetricDot, { backgroundColor: color }]} />
      <Text style={[styles.deckMetricValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.deckMetricLabel, { color: mutedColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
  },
  addButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  stat: {
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
    textTransform: "uppercase",
  },
  searchBox: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 18,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 48,
  },
  segmented: {
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 12,
    padding: 4,
  },
  segment: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    paddingVertical: 10,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  listContent: {
    gap: 12,
    padding: 20,
    paddingBottom: 120,
  },
  todoCard: {
    borderLeftWidth: 4,
    borderRadius: 8,
    flexDirection: "row",
    gap: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  checkButton: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 2,
    height: 28,
    justifyContent: "center",
    marginTop: 2,
    width: 28,
  },
  todoContent: {
    flex: 1,
  },
  todoHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  todoTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
  },
  iconButton: {
    alignItems: "center",
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  todoNotes: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  pill: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priorityDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  emptyState: {
    alignItems: "center",
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    marginTop: 24,
    padding: 28,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalCard: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "88%",
    padding: 20,
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 12,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 4,
    textTransform: "uppercase",
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  choice: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  choiceText: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  dateChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  dateChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  saveButton: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 4,
    paddingVertical: 15,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  focusDeck: {
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 18,
    padding: 16,
  },
  focusDeckTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  focusDeckLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  focusDeckTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  focusDeckBadge: {
    borderRadius: 999,
    height: 14,
    width: 14,
  },
  focusDeckStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  deckMetric: {
    backgroundColor: "rgba(127,127,127,0.08)",
    borderRadius: 8,
    flex: 1,
    padding: 12,
  },
  deckMetricDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  deckMetricValue: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 10,
  },
  deckMetricLabel: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
    textTransform: "uppercase",
  },
  focusDeckRail: {
    backgroundColor: "rgba(127,127,127,0.12)",
    borderRadius: 999,
    height: 8,
    marginTop: 14,
    overflow: "hidden",
  },
  focusDeckRailFill: {
    borderRadius: 999,
    height: "100%",
  },
});
