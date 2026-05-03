import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import useTheme from "@/hooks/useTheme";
import { useHabits } from "@/hooks/useHabits";
import { useTodos } from "@/hooks/useTodos";

const appVersion = "1.0.0";

export default function SettingsScreen() {
  const { colors, isDarkMode, toggleDarkMode } = useTheme();
  const { stats, clearCompleted, resetTodos } = useTodos();
  const { stats: habitStats, resetHabits } = useHabits();
  const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  const confirmClearCompleted = () => {
    if (stats.completed === 0) {
      Alert.alert("Nothing to clear", "Completed tasks will show up here once you finish a few.");
      return;
    }

    Alert.alert("Clear completed tasks?", `${stats.completed} completed task(s) will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          clearCompleted();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const confirmReset = () => {
    Alert.alert("Reset task list?", "This replaces your tasks with the starter list.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          resetTodos();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>Settings</Text>
          <Text style={[styles.title, { color: colors.text }]}>Make it yours</Text>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: `${colors.primary}22` }]}>
              <Ionicons color={colors.primary} name={isDarkMode ? "moon" : "sunny"} size={22} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Dark mode</Text>
              <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                Keep the app comfortable for your current light.
              </Text>
            </View>
            <Switch
              onValueChange={toggleDarkMode}
              value={isDarkMode}
              thumbColor="#ffffff"
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <Metric label="Completion" value={`${completionRate}%`} icon="analytics-outline" color={colors.primary} />
          <Metric label="All tasks" value={stats.total} icon="albums-outline" color={colors.warning} />
          <Metric label="Habits" value={habitStats.total} icon="leaf-outline" color={colors.success} />
          <Metric label="Check-ins" value={habitStats.totalCheckIns} icon="checkmark-done-outline" color={colors.danger} />
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ActionRow
            color={colors.success}
            icon="checkmark-done-outline"
            label="Clear completed"
            onPress={confirmClearCompleted}
            sublabel="Remove finished tasks from your list."
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ActionRow
            color={colors.danger}
            icon="refresh-outline"
            label="Reset starter list"
            onPress={confirmReset}
            sublabel="Restore the sample tasks for a clean demo."
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ActionRow
            color={colors.success}
            icon="leaf-outline"
            label="Reset habits"
            onPress={() => {
              Alert.alert("Reset habit list?", "This restores the starter habits only.", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Reset",
                  style: "destructive",
                  onPress: () => resetHabits(),
                },
              ]);
            }}
            sublabel="Restore the starter habits only."
          />
        </View>

        <View style={[styles.aboutPanel, { borderColor: colors.border }]}>
          <Ionicons color={colors.primary} name="checkbox-outline" size={26} />
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Focus List</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
              Offline task planning, saved on this device. Version {appVersion}.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({
  color,
  icon,
  label,
  value,
}: {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.metric, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons color={color} name={icon} size={22} />
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function ActionRow({
  color,
  icon,
  label,
  onPress,
  sublabel,
}: {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  sublabel: string;
}) {
  const { colors } = useTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionRow, { opacity: pressed ? 0.72 : 1 }]}>
      <View style={[styles.rowIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons color={color} name={icon} size={22} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{sublabel}</Text>
      </View>
      <Ionicons color={colors.textMuted} name="chevron-forward" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
  },
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  rowIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  rowSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  metric: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    width: "48%",
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 12,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
    textTransform: "uppercase",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
  },
  aboutPanel: {
    alignItems: "center",
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
});
