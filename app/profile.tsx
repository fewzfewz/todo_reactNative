import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import useTheme from "@/hooks/useTheme";
import { useProfile } from "@/hooks/useProfile";
import { UserProfileDraft } from "@/types/profile";

const avatarColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { profile, updateProfile, resetProfile } = useProfile();
  const [draft, setDraft] = useState<UserProfileDraft>({
    name: profile.name,
    role: profile.role,
    bio: profile.bio,
    focusArea: profile.focusArea,
    avatarColor: profile.avatarColor,
    dailyGoal: profile.dailyGoal,
  });

  const save = () => {
    updateProfile({
      ...draft,
      name: draft.name.trim() || "Alex",
      role: draft.role.trim() || "Builder",
      bio: draft.bio.trim() || "Keeping momentum one day at a time.",
      focusArea: draft.focusArea.trim() || "Health",
      dailyGoal: Math.max(1, Number(draft.dailyGoal) || 1),
      avatarColor: draft.avatarColor,
    });
    router.back();
  };

  const restore = () => {
    resetProfile();
    setDraft({
      name: "Alex",
      role: "Builder",
      bio: "Keeping the day moving with a calm, local-first planner.",
      focusArea: "Academics",
      avatarColor: "#3b82f6",
      dailyGoal: 3,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons color={colors.text} name="chevron-back" size={22} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: colors.textMuted }]}>Profile</Text>
            <Text style={[styles.title, { color: colors.text }]}>Make it yours</Text>
          </View>
        </View>

        <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: draft.avatarColor }]}>
            <Text style={styles.avatarText}>{(draft.name || "A").slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.previewCopy}>
            <Text style={[styles.previewName, { color: colors.text }]}>{draft.name || "Alex"}</Text>
            <Text style={[styles.previewRole, { color: colors.textMuted }]}>{draft.role || "Builder"}</Text>
            <Text style={[styles.previewBio, { color: colors.textMuted }]}>{draft.bio || "A few words about the current rhythm."}</Text>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Field label="Name" value={draft.name} onChangeText={(name) => setDraft((current) => ({ ...current, name }))} placeholder="Your name" />
          <Field label="Role" value={draft.role} onChangeText={(role) => setDraft((current) => ({ ...current, role }))} placeholder="Student, founder, creator..." />
          <Field label="Focus area" value={draft.focusArea} onChangeText={(focusArea) => setDraft((current) => ({ ...current, focusArea }))} placeholder="Academics, health, work..." />
          <Field
            label="Daily goal"
            value={String(draft.dailyGoal)}
            onChangeText={(dailyGoal) => setDraft((current) => ({ ...current, dailyGoal: Number(dailyGoal) || 1 }))}
            placeholder="3"
            keyboardType="number-pad"
          />
          <Field
            label="Bio"
            value={draft.bio}
            onChangeText={(bio) => setDraft((current) => ({ ...current, bio }))}
            placeholder="A short profile note"
            multiline
          />

          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Avatar color</Text>
          <View style={styles.colorRow}>
            {avatarColors.map((color) => (
              <Pressable
                key={color}
                onPress={() => setDraft((current) => ({ ...current, avatarColor: color }))}
                style={[
                  styles.colorOption,
                  {
                    borderColor: draft.avatarColor === color ? colors.text : colors.border,
                    backgroundColor: color,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={restore}
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.82 : 1 },
            ]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Reset profile</Text>
          </Pressable>
          <Pressable
            onPress={save}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Text style={styles.primaryButtonText}>Save profile</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "number-pad";
  multiline?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        style={[
          styles.input,
          multiline ? styles.bioInput : null,
          { backgroundColor: colors.backgrounds.input, borderColor: colors.border, color: colors.text },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  header: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 16 },
  backButton: { alignItems: "center", borderRadius: 16, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 13, fontWeight: "800", textTransform: "uppercase" },
  title: { fontSize: 30, fontWeight: "800" },
  preview: { alignItems: "center", borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 14, padding: 16 },
  avatar: { alignItems: "center", borderRadius: 18, height: 64, justifyContent: "center", width: 64 },
  avatarText: { color: "#ffffff", fontSize: 28, fontWeight: "800" },
  previewCopy: { flex: 1, minWidth: 0 },
  previewName: { fontSize: 20, fontWeight: "800" },
  previewRole: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  previewBio: { fontSize: 13, lineHeight: 18, marginTop: 6 },
  panel: { borderRadius: 8, borderWidth: 1, marginTop: 14, padding: 16 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: "800", marginBottom: 8, textTransform: "uppercase" },
  input: { borderRadius: 8, borderWidth: 1, fontSize: 16, minHeight: 50, paddingHorizontal: 14, paddingVertical: 12 },
  bioInput: { minHeight: 100, textAlignVertical: "top" },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  colorOption: { borderRadius: 999, borderWidth: 2, height: 30, width: 30 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  secondaryButton: { alignItems: "center", borderRadius: 8, borderWidth: 1, flex: 1, paddingVertical: 14 },
  secondaryButtonText: { fontSize: 15, fontWeight: "800" },
  primaryButton: { alignItems: "center", borderRadius: 8, flex: 1, paddingVertical: 14 },
  primaryButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
});
