import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  MobileConfigProvider,
  useMobileConfig,
} from "../src/lib/mobile-config";
import { theme } from "../src/lib/theme";

function AppShell() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

function LoadingShell() {
  return (
    <View style={styles.loadingShell}>
      <Text style={styles.loadingEyebrow}>Nucleo One</Text>
      <ActivityIndicator color={theme.colors.accent} size="large" />
      <Text style={styles.loadingText}>Restoring mobile session...</Text>
    </View>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 2 } },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <MobileConfigProvider>
        <StatusBar style="dark" />
        <MobileGate />
      </MobileConfigProvider>
    </QueryClientProvider>
  );
}

function MobileGate() {
  const { isReady } = useMobileConfig();
  if (!isReady) return <LoadingShell />;
  return <AppShell />;
}

const styles = StyleSheet.create({
  loadingShell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.canvas,
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  loadingEyebrow: {
    color: theme.colors.accent,
    fontFamily: "Menlo",
    textTransform: "uppercase",
    letterSpacing: 1.6,
    fontSize: 12,
  },
  loadingText: {
    color: theme.colors.muted,
    fontSize: 14,
  },
});
