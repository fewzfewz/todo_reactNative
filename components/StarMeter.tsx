import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";

import useTheme from "@/hooks/useTheme";

export default function StarMeter({
  score,
  label,
}: {
  score: number;
  label?: string;
}) {
  const { colors } = useTheme();
  const normalized = Math.max(0, Math.min(5, score));

  return (
    <View style={styles.row}>
      <View style={styles.stars}>
        {Array.from({ length: 5 }, (_, index) => {
          const filled = index < normalized;
          return (
            <Ionicons
              key={index}
              color={filled ? colors.warning : colors.border}
              name={filled ? "star" : "star-outline"}
              size={16}
            />
          );
        })}
      </View>
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  stars: {
    flexDirection: "row",
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});
