import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { theme } from "../../src/lib/theme";

export default function AuthCallbackScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={theme.colors.accent} size="large" />
      <Text style={styles.title}>Completing sign-in…</Text>
      <Text style={styles.copy}>
        You can return to Nucleo One if the browser does not close
        automatically.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.canvas,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.ink,
    fontSize: 24,
    fontFamily: "Georgia",
  },
  copy: {
    color: theme.colors.muted,
    lineHeight: 20,
    textAlign: "center",
  },
});
