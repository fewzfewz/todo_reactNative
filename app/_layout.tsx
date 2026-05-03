import { ThemeProvider } from "@/hooks/useTheme";
import { TodoProvider } from "@/hooks/useTodos";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <TodoProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ title: "Home" }} />
        </Stack>
      </TodoProvider>
    </ThemeProvider>
  );
}
