import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import useTheme from "@/hooks/useTheme";
import { useTracker } from "@/hooks/useTracker";
import { getDayLabel, getIntensity } from "@/utils/tracker";

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

export default function TrackerScreen() {
  const { colors } = useTheme();
  const { days, summary, log, week, completionRate } = useTracker();
  const motion = useSharedValue(0);

  useEffect(() => {
    motion.value = withRepeat(withTiming(1, { duration: 6500 }), -1, true);
  }, [motion]);

  const deckStyle = useAnimatedStyle(() => {
    const rotateX = interpolate(motion.value, [0, 1], [12, -10]);
    const rotateY = interpolate(motion.value, [0, 1], [-12, 12]);
    const translateY = interpolate(motion.value, [0, 1], [0, -4]);

    return {
      transform: [
        { perspective: 950 },
        { rotateX: `${rotateX}deg` },
        { rotateY: `${rotateY}deg` },
        { translateY },
      ],
    };
  });

  const matrix = Array.from({ length: 7 }, (_, rowIndex) =>
    Array.from({ length: 12 }, (_, colIndex) => {
      const index = colIndex * 7 + rowIndex;
      return days[index];
    }),
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.textMuted }]}>Activity tracker</Text>
            <Text style={[styles.title, { color: colors.text }]}>Daily streak board</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{completionRate}%</Text>
          </View>
        </View>

        <Animated.View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }, deckStyle]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.heroLabel, { color: colors.textMuted }]}>Momentum</Text>
              <Text style={[styles.heroTitle, { color: colors.text }]}>
                {summary.streak > 0 ? `${summary.streak}-day streak` : "Start your streak"}
              </Text>
              <Text style={[styles.heroHint, { color: colors.textMuted }]}>
                Best day {summary.bestDay ? getDayLabel(summary.bestDay) : "not yet recorded"}
              </Text>
            </View>
            <Ionicons color={colors.primary} name="pulse-outline" size={22} />
          </View>

          <View style={styles.heroStats}>
            <HeroStat label="Completed" value={summary.totalCompleted} color={colors.success} />
            <HeroStat label="Created" value={summary.totalCreated} color={colors.primary} />
            <HeroStat label="Best day" value={summary.bestDayCount} color={colors.warning} />
          </View>

          <View style={styles.heroRail}>
            <View
              style={[
                styles.heroRailFill,
                {
                  width: `${Math.min(100, Math.max(8, completionRate + summary.streak * 4))}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        </Animated.View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contribution table</Text>
            <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
              {getDayLabel(days[0]?.date ?? new Date().toISOString())} -{" "}
              {getDayLabel(days[days.length - 1]?.date ?? new Date().toISOString())}
            </Text>
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
                  {row.map((day, colIndex) => {
                    const intensity = getIntensity(day?.completed ?? 0);
                    return (
                      <View
                        key={`${rowIndex}-${colIndex}`}
                        style={[
                          styles.cell,
                          {
                            backgroundColor:
                              intensity === 0
                                ? colors.bg
                                : intensity === 1
                                  ? `${colors.primary}25`
                                  : intensity === 2
                                    ? `${colors.primary}45`
                                    : intensity === 3
                                      ? `${colors.primary}75`
                                      : colors.primary,
                            borderColor: colors.border,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly graph</Text>
            <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>Created vs completed</Text>
          </View>

          <View style={styles.chart}>
            {week.map((day, index) => {
              const peak = Math.max(1, ...week.map((item) => item.created + item.completed));
              const createdHeight = Math.max(8, (day.created / peak) * 112);
              const completedHeight = Math.max(8, (day.completed / peak) * 112);

              return (
                <Animated.View
                  key={day.date}
                  entering={FadeInDown.delay(index * 55).duration(320)}
                  style={styles.barColumn}
                >
                  <View style={styles.barStack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: createdHeight,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.bar,
                        {
                          height: completedHeight,
                          backgroundColor: colors.success,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartLabel, { color: colors.textMuted }]}>
                    {new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" })}
                  </Text>
                </Animated.View>
              );
            })}
          </View>

          <View style={styles.legendRow}>
            <LegendDot color={colors.primary} label="Created" />
            <LegendDot color={colors.success} label="Completed" />
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent log</Text>
            <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>Top activity</Text>
          </View>

          <View style={styles.logList}>
            {log.map((item) => (
              <View key={item.id} style={styles.logRow}>
                <View style={[styles.logBadge, { backgroundColor: colors.bg }]}>
                  <Text
                    style={[
                      styles.logBadgeText,
                      {
                        color:
                          item.kind === "completed"
                            ? colors.success
                            : item.kind === "urgent"
                              ? colors.danger
                              : colors.primary,
                      },
                    ]}
                  >
                    {item.kind}
                  </Text>
                </View>
                <View style={styles.logText}>
                  <Text style={[styles.logTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.logMeta, { color: colors.textMuted }]}>
                    {item.subtitle} · {item.time}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroStat({
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
    <View style={[styles.heroStat, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={[styles.heroStatDot, { backgroundColor: color }]} />
      <Text style={[styles.heroStatValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.heroStatLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
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
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
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
  badge: {
    alignItems: "center",
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  hero: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 18,
    padding: 16,
  },
  heroTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  heroHint: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },
  heroStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  heroStat: {
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  heroStatDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  heroStatValue: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 10,
  },
  heroStatLabel: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
    textTransform: "uppercase",
  },
  heroRail: {
    backgroundColor: "rgba(127,127,127,0.12)",
    borderRadius: 999,
    height: 8,
    marginTop: 14,
    overflow: "hidden",
  },
  heroRailFill: {
    borderRadius: 999,
    height: "100%",
  },
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: "700",
  },
  table: {
    flexDirection: "row",
    gap: 8,
  },
  dayColumn: {
    justifyContent: "space-between",
    paddingTop: 2,
    width: 18,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "800",
    height: 16,
    textAlign: "center",
  },
  grid: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
  },
  weekColumn: {
    flex: 1,
    gap: 4,
  },
  cell: {
    aspectRatio: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  chart: {
    flexDirection: "row",
    gap: 8,
    height: 180,
    marginTop: 6,
  },
  barColumn: {
    flex: 1,
    justifyContent: "flex-end",
  },
  barStack: {
    alignItems: "center",
    flexDirection: "column-reverse",
    gap: 4,
    height: 140,
    justifyContent: "flex-start",
  },
  bar: {
    borderRadius: 999,
    minHeight: 6,
    width: "72%",
  },
  chartLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  legendRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  legendDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  logList: {
    gap: 12,
  },
  logRow: {
    flexDirection: "row",
    gap: 10,
  },
  logBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  logText: {
    flex: 1,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  logMeta: {
    fontSize: 12,
    marginTop: 3,
  },
});
