import type { PropsWithChildren, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { theme } from "../lib/theme";

export function Screen({
  children,
  scroll = false,
}: PropsWithChildren<{ scroll?: boolean }>) {
  if (scroll) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={styles.screen}>{children}</View>;
}

export function HeaderBlock({
  eyebrow,
  title,
  subtitle,
  sidecar,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  sidecar?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {sidecar ? <View style={styles.sidecar}>{sidecar}</View> : null}
    </View>
  );
}

export function Panel({
  children,
  accent = theme.colors.ocean,
}: PropsWithChildren<{ accent?: string }>) {
  return (
    <View style={styles.panel}>
      <View style={[styles.panelAccent, { backgroundColor: accent }]} />
      {children}
    </View>
  );
}

export function SectionLabel({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricNote}>{note}</Text>
    </View>
  );
}

export function Pill({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: "muted" | "accent" | "danger";
}) {
  const backgroundColor =
    tone === "accent"
      ? theme.colors.accentSoft
      : tone === "danger"
        ? "#f8d8d8"
        : "#ece6d8";
  const color =
    tone === "accent"
      ? theme.colors.accent
      : tone === "danger"
        ? theme.colors.danger
        : theme.colors.muted;

  return (
    <View style={[styles.pill, { backgroundColor }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.primaryButton}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "numeric" | "url";
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#928b7b"
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        style={[styles.input, multiline && styles.textarea]}
      />
    </View>
  );
}

export function EmptyState({
  title,
  copy,
}: {
  title: string;
  copy: string;
}) {
  return (
    <Panel accent={theme.colors.gold}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyCopy}>{copy}</Text>
    </Panel>
  );
}

export function Sheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
}: PropsWithChildren<{
  visible: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
}>) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.sheetBackdrop}
      >
        <Pressable style={styles.sheetDismiss} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.sheetEyebrow}>Quick add</Text>
          <Text style={styles.sheetTitle}>{title}</Text>
          <Text style={styles.sheetSubtitle}>{subtitle}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
    paddingHorizontal: theme.spacing.md,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.ink,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#202b43",
  },
  headerText: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  eyebrow: {
    color: theme.colors.accentSoft,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: theme.spacing.sm,
    fontFamily: "Menlo",
  },
  title: {
    color: theme.colors.white,
    fontSize: 32,
    lineHeight: 36,
    fontFamily: "Georgia",
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: "#b8c2d9",
    fontSize: 14,
    lineHeight: 20,
  },
  sidecar: {
    justifyContent: "center",
  },
  panel: {
    backgroundColor: theme.colors.paper,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
  },
  panelAccent: {
    height: 4,
    borderRadius: theme.radius.pill,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    color: theme.colors.ink,
    fontWeight: "700",
  },
  metricCard: {
    width: "48%",
    backgroundColor: theme.colors.paper,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  metricLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metricValue: {
    color: theme.colors.ink,
    fontSize: 28,
    lineHeight: 32,
    fontFamily: "Georgia",
    marginTop: theme.spacing.sm,
  },
  metricNote: {
    color: theme.colors.muted,
    fontSize: 13,
    marginTop: theme.spacing.xs,
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: "#ece6d8",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: theme.colors.ink,
    fontWeight: "700",
    fontSize: 15,
  },
  field: {
    marginBottom: theme.spacing.md,
  },
  fieldLabel: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.ink,
    fontSize: 15,
  },
  textarea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Georgia",
    color: theme.colors.ink,
    marginBottom: theme.spacing.xs,
  },
  emptyCopy: {
    fontSize: 14,
    color: theme.colors.muted,
    lineHeight: 20,
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetDismiss: {
    flex: 1,
    backgroundColor: "rgba(24, 32, 51, 0.3)",
  },
  sheet: {
    maxHeight: "84%",
    backgroundColor: theme.colors.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sheetEyebrow: {
    color: theme.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontSize: 12,
    marginBottom: theme.spacing.xs,
    fontFamily: "Menlo",
  },
  sheetTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: "Georgia",
    color: theme.colors.ink,
  },
  sheetSubtitle: {
    color: theme.colors.muted,
    fontSize: 14,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
});
