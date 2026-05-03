import { ThemeProvider } from "@/hooks/useTheme";
import { HabitProvider } from "@/hooks/useHabits";
import { TodoProvider } from "@/hooks/useTodos";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <TodoProvider>
        <HabitProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ title: "Home" }} />
          </Stack>
        </HabitProvider>
      </TodoProvider>
    </ThemeProvider>
  );
}
