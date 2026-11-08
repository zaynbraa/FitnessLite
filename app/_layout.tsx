import "../global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { AuthGate } from "../src/components/AuthGate";
import { useDayRollover } from "../src/hooks/useDayRollover";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function AppContent() {
  useDayRollover();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthGate>
        <AppContent />
      </AuthGate>
    </SafeAreaProvider>
  );
}
