import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import StarMeter from "@/components/StarMeter";
import useTheme from "@/hooks/useTheme";
import { useHabits } from "@/hooks/useHabits";
import { buildHabitDays, buildHabitWeekSeries, countHabitStreak } from "@/utils/habitTracker";

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

const dayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function HabitTrackerScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { habits, groups, toggleCheckIn } = useHabits();

  const habit = habits.find((item) => item.id === id);
  const groupSummary = groups.find((group) => group.group === habit?.group);

  const days = useMemo(() => (habit ? buildHabitDays(habit) : []), [habit]);
  const week = useMemo(() => (habit ? buildHabitWeekSeries(habit) : []), [habit]);
  const streak = useMemo(() => (habit ? countHabitStreak(habit.checkIns) : 0), [habit]);

  if (!habit) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <View style={styles.missingState}>
          <Ionicons color={colors.textMuted} name="leaf-outline" size={30} />
          <Text style={[styles.missingTitle, { color: colors.text }]}>Habit not found</Text>
          <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.backButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const matrix = Array.from({ length: 7 }, (_, rowIndex) =>
    Array.from({ length: 12 }, (_, colIndex) => {
      const index = colIndex * 7 + rowIndex;
      return days[index];
    }),
  );

  const recentHistory = [...habit.checkIns]
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 8)
    .map((day) => new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backIcon,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons color={colors.text} name="chevron-back" size={22} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: colors.textMuted }]}>Habit tracker</Text>
            <Text style={[styles.title, { color: colors.text }]}>{habit.title}</Text>
          </View>
        </View>

        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={[styles.heroLabel, { color: colors.textMuted }]}>{habit.group}</Text>
              <Text style={[styles.heroTitle, { color: colors.text }]}>
                {streak > 0 ? `${streak}-day streak` : "Start the streak"}
              </Text>
              <Text style={[styles.heroHint, { color: colors.textMuted }]}>
                This page is only for this habit, so the tracker table stays focused.
              </Text>
            </View>
            <View style={[styles.colorChip, { backgroundColor: habit.color }]} />
          </View>

          <View style={styles.heroStats}>
            <Stat label="Check-ins" value={habit.checkIns.length} color={colors.primary} />
            <Stat label="Goal" value={`${habit.goalPerWeek}/wk`} color={colors.warning} />
            <Stat label="Done today" value={habit.checkIns.includes(dayKey()) ? "Yes" : "No"} color={colors.success} />
          </View>

          <Pressable
            onPress={() => {
              toggleCheckIn(habit.id);
            }}
            style={({ pressed }) => [
              styles.checkButton,
              {
                backgroundColor: habit.checkIns.includes(dayKey())
                  ? colors.success
                  : colors.primary,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Ionicons color="#ffffff" name="checkmark" size={18} />
            <Text style={styles.checkText}>
              {habit.checkIns.includes(dayKey()) ? "Tracked today" : "Check in now"}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tracker table</Text>
            <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>Last 84 days</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.dayColumn}>
              {dayLabels.map((label) => (
                <Text key={label} style={[styles.dayLabel, { color: colors.textMuted }]}>
                  {label}
                </Text>
              ))}
            </View>
            <View style={styles.grid}>
              {matrix.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.weekColumn}>
                  {row.map((day, colIndex) => (
                    <View
                      key={`${rowIndex}-${colIndex}`}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: day && day.checkIns ? habit.color : colors.bg,
                          borderColor: colors.border,
                        },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly pulse</Text>
            <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>Last 7 days</Text>
          </View>

          <View style={styles.weekChart}>
            {week.map((day, index) => (
              <Animated.View key={day.date} entering={FadeInDown.delay(index * 35).duration(260)} style={styles.weekColumnWrap}>
                <View style={styles.weekBarStack}>
                  <View
                    style={[
                      styles.weekBar,
                      {
                        height: day.checkIns ? 108 : 12,
                        backgroundColor: habit.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.weekLabel, { color: colors.textMuted }]}>
                  {new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" })}
                </Text>
              </Animated.View>
            ))}
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Group score</Text>
            <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
              {groupSummary?.habitCount ?? 1} habit(s) in {habit.group}
            </Text>
          </View>
          <StarMeter score={groupSummary?.score ?? 0} label={`${groupSummary?.weeklyCheckIns ?? habit.checkIns.length} weekly check-ins`} />

          <View style={styles.summaryGrid}>
            <SummaryChip label="Best streak" value={`${groupSummary?.bestStreak ?? streak} days`} color={colors.primary} />
            <SummaryChip label="Total" value={groupSummary?.totalCheckIns ?? habit.checkIns.length} color={colors.success} />
            <SummaryChip label="Weekly goal" value={groupSummary?.weeklyGoal ?? habit.goalPerWeek} color={colors.warning} />
            <SummaryChip label="Group" value={habit.group} color={habit.color} />
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent history</Text>
            <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>Most recent check-ins</Text>
          </View>

          <View style={styles.historyRow}>
            {recentHistory.length ? (
              recentHistory.map((date) => (
                <View key={date} style={[styles.historyChip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                  <Text style={[styles.historyText, { color: colors.text }]}>{date}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyHistory, { color: colors.textMuted }]}>No check-ins yet. This habit is waiting for its first green square.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.stat, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function SummaryChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.summaryChip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  header: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 16 },
  backIcon: { alignItems: "center", borderRadius: 16, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 13, fontWeight: "800", textTransform: "uppercase" },
  title: { fontSize: 30, fontWeight: "800" },
  hero: { borderRadius: 8, borderWidth: 1, padding: 16 },
  heroTop: { alignItems: "center", flexDirection: "row", gap: 14 },
  heroCopy: { flex: 1, minWidth: 0 },
  heroLabel: { fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  heroTitle: { fontSize: 20, fontWeight: "800", marginTop: 4 },
  heroHint: { fontSize: 13, lineHeight: 18, marginTop: 6 },
  colorChip: { borderRadius: 999, height: 16, width: 16 },
  heroStats: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
  stat: { borderRadius: 8, borderWidth: 1, flexBasis: "31%", minWidth: 90, padding: 12 },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "800", marginTop: 2, textTransform: "uppercase" },
  checkButton: { alignItems: "center", borderRadius: 8, flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 14, paddingVertical: 14 },
  checkText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  panel: { borderRadius: 8, borderWidth: 1, marginTop: 14, padding: 16 },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  sectionMeta: { fontSize: 12, fontWeight: "700" },
  table: { flexDirection: "row", gap: 10 },
  dayColumn: { justifyContent: "space-between", paddingVertical: 3 },
  dayLabel: { fontSize: 12, fontWeight: "800", height: 11, textAlign: "center" },
  grid: { flex: 1, flexDirection: "row", gap: 4 },
  weekColumn: { flex: 1, gap: 4 },
  cell: { borderRadius: 3, borderWidth: 1, aspectRatio: 1, width: "100%" },
  weekChart: { flexDirection: "row", alignItems: "flex-end", gap: 10, justifyContent: "space-between" },
  weekColumnWrap: { alignItems: "center", flex: 1, gap: 8 },
  weekBarStack: { alignItems: "center", height: 110, justifyContent: "flex-end" },
  weekBar: { borderRadius: 8, width: 20 },
  weekLabel: { fontSize: 12, fontWeight: "700" },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  summaryChip: { borderRadius: 8, borderWidth: 1, flexBasis: "48%", padding: 12 },
  summaryValue: { fontSize: 16, fontWeight: "800" },
  summaryLabel: { fontSize: 11, fontWeight: "800", marginTop: 2, textTransform: "uppercase" },
  historyRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  historyChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  historyText: { fontSize: 12, fontWeight: "700" },
  emptyHistory: { fontSize: 13, lineHeight: 18 },
  missingState: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  missingTitle: { fontSize: 20, fontWeight: "800", marginTop: 12 },
  backButton: { borderRadius: 8, marginTop: 16, paddingHorizontal: 18, paddingVertical: 12 },
  backButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
});
