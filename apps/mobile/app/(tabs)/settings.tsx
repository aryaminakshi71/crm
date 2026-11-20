import { useQuery } from "@tanstack/react-query";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import {
  Field,
  HeaderBlock,
  Panel,
  Pill,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionLabel,
} from "../../src/components/mobile-ui";
import { useCrmClient } from "../../src/lib/api";
import { useMobileConfig } from "../../src/lib/mobile-config";
import { theme } from "../../src/lib/theme";

const APP_VERSION = "1.0.0";

export default function SettingsScreen() {
  const {
    authToken,
    apiBaseUrl,
    currentUser,
    demoMode,
    isAuthenticated,
    organizationId,
    resetDefaults,
    setApiBaseUrl,
    setDemoMode,
    setOrganizationId,
    signOut,
  } = useMobileConfig();
  const client = useCrmClient();

  const healthQuery = useQuery({
    queryKey: ["mobile", "health", apiBaseUrl, demoMode, organizationId],
    queryFn: client.health,
  });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert(
        "Sign out failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  };

  const handleResetDefaults = () => {
    Alert.alert(
      "Reset to defaults",
      "This will clear your API URL, organization ID, and demo mode setting. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => resetDefaults(),
        },
      ],
    );
  };

  return (
    <Screen scroll>
      <HeaderBlock
        eyebrow="Control room"
        title="Settings"
        subtitle="Manage your account, API connection, and app preferences."
        sidecar={
          isAuthenticated ? (
            <Pill label="Signed in" tone="accent" />
          ) : (
            <Pill label={demoMode ? "Demo" : "Guest"} />
          )
        }
      />

      {/* User info */}
      <SectionLabel title="Account" />
      <Panel accent={theme.colors.accent}>
        {isAuthenticated ? (
          <>
            <Text style={styles.userName}>
              {currentUser?.name || "Authenticated user"}
            </Text>
            <Text style={styles.userEmail}>
              {currentUser?.email || "No email on record"}
            </Text>
            <View style={styles.gap}>
              <SecondaryButton
                label="Sign out"
                onPress={() => void handleSignOut()}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.userName}>Not signed in</Text>
            <Text style={styles.userEmail}>
              {demoMode
                ? "Running in demo mode — no auth required."
                : "Go to the Setup tab to sign in with email or a social provider."}
            </Text>
          </>
        )}
      </Panel>

      {/* Demo mode toggle */}
      <SectionLabel title="Demo mode" />
      <Panel accent={theme.colors.gold}>
        <View style={styles.toggleRow}>
          <View style={styles.flex}>
            <Text style={styles.toggleTitle}>Enable demo mode</Text>
            <Text style={styles.toggleCopy}>
              Sends the `demo-org` header so the app works without signing in.
              Toggle off to use a real account and organization.
            </Text>
          </View>
          <Switch
            value={demoMode}
            onValueChange={setDemoMode}
            thumbColor={demoMode ? theme.colors.accent : "#d3d7df"}
            trackColor={{ false: "#d8deea", true: "#ffd7c6" }}
          />
        </View>
      </Panel>

      {/* Connection */}
      <SectionLabel title="Connection" />
      <Panel accent={theme.colors.ocean}>
        <Field
          label="API base URL"
          value={apiBaseUrl}
          onChangeText={setApiBaseUrl}
          placeholder="http://10.0.2.2:8787"
          keyboardType="url"
        />
        <Field
          label="Organization ID"
          value={organizationId}
          onChangeText={setOrganizationId}
          placeholder="demo-org"
        />
        <View style={styles.statusRow}>
          <View style={styles.flex}>
            <Text style={styles.statusLabel}>
              {healthQuery.isLoading
                ? "Checking API..."
                : healthQuery.data?.status === "ok"
                  ? "Connected"
                  : "Waiting for API"}
            </Text>
            <Text style={styles.statusMeta}>
              {healthQuery.data
                ? `v${healthQuery.data.version} · ${healthQuery.data.timestamp}`
                : authToken
                  ? "Bearer token in secure storage."
                  : "No auth token yet."}
            </Text>
          </View>
          <PrimaryButton
            label={healthQuery.isLoading ? "Checking..." : "Ping API"}
            onPress={() => healthQuery.refetch()}
          />
        </View>
      </Panel>

      {/* Danger zone */}
      <SectionLabel title="Advanced" />
      <Panel accent={theme.colors.danger}>
        <Text style={styles.dangerTitle}>Reset to defaults</Text>
        <Text style={styles.dangerCopy}>
          Clears the API URL, organization ID, and demo mode flag back to
          factory defaults. Your auth token and session are not affected.
        </Text>
        <View style={styles.gap}>
          <SecondaryButton
            label="Reset to defaults"
            onPress={handleResetDefaults}
          />
        </View>
      </Panel>

      {/* Version info */}
      <View style={styles.versionBlock}>
        <Text style={styles.versionText}>Nucleo One Mobile</Text>
        <Text style={styles.versionMeta}>Version {APP_VERSION}</Text>
        <Text style={styles.versionMeta}>
          Built with Expo · React Native · Better Auth
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  gap: {
    marginTop: theme.spacing.sm,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.ink,
    fontFamily: "Georgia",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.muted,
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    alignItems: "center",
  },
  toggleTitle: {
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  toggleCopy: {
    color: theme.colors.muted,
    marginTop: 4,
    lineHeight: 19,
    fontSize: 13,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.ink,
  },
  statusMeta: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
    lineHeight: 18,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.danger,
    marginBottom: 4,
  },
  dangerCopy: {
    fontSize: 13,
    color: theme.colors.muted,
    lineHeight: 19,
  },
  versionBlock: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
    gap: 4,
  },
  versionText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.muted,
  },
  versionMeta: {
    fontSize: 12,
    color: theme.colors.muted,
  },
});
