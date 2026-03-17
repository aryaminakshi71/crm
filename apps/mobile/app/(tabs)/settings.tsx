import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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

export default function SettingsScreen() {
  const {
    authToken,
    apiBaseUrl,
    currentSession,
    currentUser,
    demoMode,
    isAuthenticated,
    organizationId,
    refreshSession,
    setApiBaseUrl,
    setDemoMode,
    setOrganizationId,
    resetDefaults,
    signIn,
    signInWithSocial,
    signOut,
    signUp,
  } = useMobileConfig();
  const client = useCrmClient();
  const [signInEmail, setSignInEmail] = useState("demo@nucleo.one");
  const [signInPassword, setSignInPassword] = useState("password");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState<
    "signin" | "signup" | "google" | "github" | null
  >(null);

  const healthQuery = useQuery({
    queryKey: ["mobile", "health", apiBaseUrl, demoMode, organizationId],
    queryFn: client.health,
  });

  const handleSignIn = async () => {
    try {
      setIsSubmitting("signin");
      await signIn({ email: signInEmail, password: signInPassword });
      await healthQuery.refetch();
    } catch (error) {
      Alert.alert(
        "Sign in failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleSignUp = async () => {
    try {
      setIsSubmitting("signup");
      await signUp({
        name: signUpName,
        email: signUpEmail,
        password: signUpPassword,
      });
      await healthQuery.refetch();
    } catch (error) {
      Alert.alert(
        "Sign up failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setIsSubmitting(null);
    }
  };

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

  const handleSocialSignIn = async (provider: "google" | "github") => {
    try {
      setIsSubmitting(provider);
      await signInWithSocial(provider);
      await healthQuery.refetch();
    } catch (error) {
      Alert.alert(
        `${provider === "google" ? "Google" : "GitHub"} sign in failed`,
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <Screen scroll>
      <HeaderBlock
        eyebrow="Control room"
        title="Mobile setup"
        subtitle="Tune API reachability, switch between demo mode and a real account, and prepare the app for device builds."
        sidecar={
          isAuthenticated ? (
            <Pill label="Signed in" tone="accent" />
          ) : (
            <Pill label={demoMode ? "Demo mode" : "Guest"} />
          )
        }
      />

      <SectionLabel title="Account session" />
      <Panel accent={theme.colors.accent}>
        {isAuthenticated ? (
          <>
            <Text style={styles.statusTitle}>Signed in as</Text>
            <Text style={styles.sessionIdentity}>
              {currentUser?.name || currentUser?.email || "Authenticated user"}
            </Text>
            <Text style={styles.statusCopy}>
              {currentUser?.email || "No email provided"}
              {"\n"}
              Organization:{" "}
              {currentSession?.session?.activeOrganizationId ||
                currentSession?.activeOrganizationId ||
                organizationId}
            </Text>
            <View style={styles.actions}>
              <PrimaryButton
                label="Refresh session"
                onPress={() => void refreshSession()}
              />
              <SecondaryButton
                label="Sign out"
                onPress={() => void handleSignOut()}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.statusTitle}>Email sign in</Text>
            <Text style={styles.statusCopy}>
              Use the same Better Auth credentials as the web app. When sign-in
              succeeds, the mobile client stores the bearer token securely and
              restores it on launch.
            </Text>
            <Field
              label="Email"
              value={signInEmail}
              onChangeText={setSignInEmail}
              placeholder="you@company.com"
              keyboardType="email-address"
            />
            <Field
              label="Password"
              value={signInPassword}
              onChangeText={setSignInPassword}
              placeholder="••••••••"
            />
            <PrimaryButton
              label={isSubmitting === "signin" ? "Signing in..." : "Sign in"}
              onPress={() => void handleSignIn()}
            />
            <View style={styles.socialRow}>
              <SecondaryButton
                label={
                  isSubmitting === "google"
                    ? "Connecting Google..."
                    : "Continue with Google"
                }
                onPress={() => void handleSocialSignIn("google")}
              />
              <SecondaryButton
                label={
                  isSubmitting === "github"
                    ? "Connecting GitHub..."
                    : "Continue with GitHub"
                }
                onPress={() => void handleSocialSignIn("github")}
              />
            </View>
            <Text style={styles.socialHint}>
              Social login opens the system browser, completes OAuth against the
              same Better Auth backend as the web app, then returns a bearer
              token to secure storage.
            </Text>
            <View style={styles.divider} />
            <Text style={styles.tipTitle}>Create an account</Text>
            <Field
              label="Full name"
              value={signUpName}
              onChangeText={setSignUpName}
              placeholder="Nina Stone"
            />
            <Field
              label="Email"
              value={signUpEmail}
              onChangeText={setSignUpEmail}
              placeholder="nina@company.com"
              keyboardType="email-address"
            />
            <Field
              label="Password"
              value={signUpPassword}
              onChangeText={setSignUpPassword}
              placeholder="Choose a strong password"
            />
            <SecondaryButton
              label={
                isSubmitting === "signup" ? "Creating..." : "Create account"
              }
              onPress={() => void handleSignUp()}
            />
          </>
        )}
      </Panel>

      <SectionLabel title="Connection target" />
      <Panel accent={theme.colors.accent}>
        <Field
          label="API base URL"
          value={apiBaseUrl}
          onChangeText={setApiBaseUrl}
          placeholder="http://10.0.2.2:8787"
          keyboardType="url"
        />
        <View style={styles.toggleRow}>
          <View style={styles.flex}>
            <Text style={styles.toggleTitle}>Demo mode</Text>
            <Text style={styles.toggleCopy}>
              Sends the `demo-org` header so the mobile app works instantly even
              without signing in.
            </Text>
          </View>
          <Switch
            value={demoMode}
            onValueChange={setDemoMode}
            thumbColor={demoMode ? theme.colors.accent : "#d3d7df"}
            trackColor={{ false: "#d8deea", true: "#ffd7c6" }}
          />
        </View>
        <Field
          label="Organization ID"
          value={organizationId}
          onChangeText={setOrganizationId}
          placeholder="demo-org"
        />
        <View style={styles.actions}>
          <PrimaryButton
            label="Refresh health"
            onPress={() => healthQuery.refetch()}
          />
          <SecondaryButton label="Reset defaults" onPress={resetDefaults} />
        </View>
      </Panel>

      <SectionLabel title="Runtime status" />
      <Panel accent={theme.colors.ocean}>
        <Text style={styles.statusTitle}>
          {healthQuery.isLoading
            ? "Checking API..."
            : healthQuery.data?.status === "ok"
              ? "Connected"
              : "Waiting for API"}
        </Text>
        <Text style={styles.statusCopy}>
          {healthQuery.data
            ? `Version ${healthQuery.data.version} · ${healthQuery.data.timestamp}`
            : "Start the API with `bun run dev:api`, then point this URL at the reachable host for the target simulator or device."}
          {"\n"}
          {authToken
            ? "Bearer token present in secure storage."
            : "No persisted auth token yet."}
        </Text>
      </Panel>

      <SectionLabel title="Host cheat sheet" />
      <Panel accent={theme.colors.gold}>
        <Text style={styles.tipTitle}>Android emulator</Text>
        <Text style={styles.tipCopy}>
          Use `http://10.0.2.2:8787` to reach the local API running on your Mac.
        </Text>
        <Text style={styles.tipTitle}>iOS simulator</Text>
        <Text style={styles.tipCopy}>
          Use `http://127.0.0.1:8787` or `http://localhost:8787`.
        </Text>
        <Text style={styles.tipTitle}>Physical device</Text>
        <Text style={styles.tipCopy}>
          Use your computer's LAN IP, for example `http://192.168.x.x:8787`.
        </Text>
        <Text style={styles.tipTitle}>OAuth callback host</Text>
        <Text style={styles.tipCopy}>
          Set `BETTER_AUTH_BASE_URL` on the API to the public auth host that
          Google and GitHub will redirect back to, for example
          `https://api.nucleo.one` in production or a tunnel URL during device
          testing.
        </Text>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    alignItems: "center",
    marginBottom: theme.spacing.md,
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
  },
  actions: {
    gap: theme.spacing.sm,
  },
  socialRow: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  socialHint: {
    color: theme.colors.muted,
    lineHeight: 20,
    marginTop: theme.spacing.xs,
  },
  sessionIdentity: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
  },
  statusTitle: {
    color: theme.colors.ink,
    fontSize: 24,
    fontFamily: "Georgia",
    marginBottom: theme.spacing.xs,
  },
  statusCopy: {
    color: theme.colors.muted,
    lineHeight: 20,
  },
  tipTitle: {
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: "700",
    marginTop: theme.spacing.sm,
  },
  tipCopy: {
    color: theme.colors.muted,
    lineHeight: 20,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
});
