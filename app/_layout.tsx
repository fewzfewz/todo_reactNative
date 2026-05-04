import { ThemeProvider } from "@/hooks/useTheme";
import { HabitProvider } from "@/hooks/useHabits";
import { ProfileProvider } from "@/hooks/useProfile";
import { TodoProvider } from "@/hooks/useTodos";
import { configureNotifications } from "@/utils/reminders";
import { Stack } from "expo-router";

configureNotifications();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <TodoProvider>
        <HabitProvider>
          <ProfileProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ title: "Momentum Forge" }} />
              <Stack.Screen name="profile" options={{ title: "Profile" }} />
              <Stack.Screen name="habits/[id]" options={{ title: "Habit detail" }} />
            </Stack>
          </ProfileProvider>
        </HabitProvider>
      </TodoProvider>
    </ThemeProvider>
  );
}
