import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  EmptyState,
  Field,
  HeaderBlock,
  MetricCard,
  Panel,
  Pill,
  PrimaryButton,
  Screen,
  SectionLabel,
  Sheet,
} from "../../src/components/mobile-ui";
import { useCrmClient } from "../../src/lib/api";
import { useMobileConfig } from "../../src/lib/mobile-config";
import { formatCurrency, formatRelativeDate, theme } from "../../src/lib/theme";
import type { Invoice } from "../../src/lib/types";

function statusTone(status: string): "accent" | "muted" | "danger" {
  if (status === "paid") return "accent";
  if (status === "overdue") return "danger";
  return "muted";
}

function statusAccent(status: string) {
  switch (status) {
    case "paid":
      return "#22c55e";
    case "overdue":
      return theme.colors.danger;
    case "sent":
      return theme.colors.ocean;
    default:
      return theme.colors.muted;
  }
}

function computeStats(invoices: Invoice[]) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let outstanding = 0;
  let paidThisMonth = 0;

  for (const inv of invoices) {
    const total = Number(inv.total ?? 0);
    if (inv.status === "overdue" || inv.status === "sent") {
      outstanding += total;
    }
    if (inv.status === "paid" && inv.createdAt) {
      const created = new Date(inv.createdAt);
      if (created >= startOfMonth) {
        paidThisMonth += total;
      }
    }
  }

  return { outstanding, paidThisMonth };
}

export default function InvoicingScreen() {
  const client = useCrmClient();
  const { apiBaseUrl, demoMode, organizationId } = useMobileConfig();
  const cacheScope = [apiBaseUrl, demoMode, organizationId];
  const queryClient = useQueryClient();

  const [showComposer, setShowComposer] = useState(false);
  const [total, setTotal] = useState("");
  const [status, setStatus] = useState("draft");
  const [dueAt, setDueAt] = useState("");

  const invoicesQuery = useQuery({
    queryKey: ["mobile", "invoices", ...cacheScope],
    queryFn: client.invoices.list,
  });

  const createMutation = useMutation({
    mutationFn: client.invoices.create,
    onSuccess: async () => {
      setShowComposer(false);
      setTotal("");
      setStatus("draft");
      setDueAt("");
      await queryClient.invalidateQueries({ queryKey: ["mobile", "invoices"] });
    },
    onError: (error) => {
      Alert.alert("Could not create invoice", error.message);
    },
  });

  const invoices = invoicesQuery.data?.data ?? [];
  const { outstanding, paidThisMonth } = computeStats(invoices);

  const STATUSES = ["draft", "sent", "paid", "overdue"];

  return (
    <Screen>
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={invoicesQuery.isRefetching}
            onRefresh={() => invoicesQuery.refetch()}
            tintColor={theme.colors.accent}
          />
        }
        ListHeaderComponent={
          <View>
            <HeaderBlock
              eyebrow="Billing ledger"
              title="Invoicing"
              subtitle="Track outstanding balances, payments received, and draft invoices."
              sidecar={
                <PrimaryButton
                  label="New invoice"
                  onPress={() => setShowComposer(true)}
                />
              }
            />
            <View style={styles.metricsRow}>
              <MetricCard
                label="Outstanding"
                value={formatCurrency(outstanding)}
                note="sent + overdue"
              />
              <MetricCard
                label="Paid this month"
                value={formatCurrency(paidThisMonth)}
                note="calendar month"
              />
            </View>
            <SectionLabel title={`${invoices.length} invoices`} />
          </View>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Panel accent={statusAccent(item.status)}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.invoiceNumber}>
                  {item.invoiceNumber ?? `INV-${item.id.slice(0, 6).toUpperCase()}`}
                </Text>
                <Text style={styles.meta}>
                  {item.dueAt
                    ? `Due ${formatRelativeDate(item.dueAt)}`
                    : formatRelativeDate(item.createdAt)}
                </Text>
              </View>
              <View style={styles.rightCol}>
                <Text style={styles.amount}>{formatCurrency(item.total)}</Text>
                <Pill label={item.status} tone={statusTone(item.status)} />
              </View>
            </View>
          </Panel>
        )}
        ListEmptyComponent={
          invoicesQuery.isLoading ? (
            <Panel accent={theme.colors.mint}>
              <Text style={styles.meta}>Loading invoices...</Text>
            </Panel>
          ) : (
            <EmptyState
              title="No invoices yet"
              copy="Create your first invoice to start tracking payments and outstanding balances."
            />
          )
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowComposer(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Sheet
        visible={showComposer}
        title="New invoice"
        subtitle="Create a draft invoice and set the amount and due date."
        onClose={() => setShowComposer(false)}
      >
        <Field
          label="Amount (USD)"
          value={total}
          onChangeText={setTotal}
          placeholder="0"
          keyboardType="numeric"
        />
        <Field
          label="Due date (YYYY-MM-DD)"
          value={dueAt}
          onChangeText={setDueAt}
          placeholder="2026-04-30"
        />
        <Text style={styles.statusLabel}>Status</Text>
        <View style={styles.statusRow}>
          {STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.statusChip,
                { borderColor: statusAccent(s) },
                status === s && { backgroundColor: statusAccent(s) },
              ]}
              onPress={() => setStatus(s)}
            >
              <Text
                style={[
                  styles.statusChipText,
                  { color: status === s ? theme.colors.white : statusAccent(s) },
                ]}
              >
                {s.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <PrimaryButton
          label={createMutation.isPending ? "Creating..." : "Create invoice"}
          onPress={() =>
            createMutation.mutate({
              total: Number(total) || 0,
              status,
              dueAt: dueAt || null,
            })
          }
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 96,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  flex: {
    flex: 1,
  },
  rightCol: {
    alignItems: "flex-end",
    gap: theme.spacing.xs,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.ink,
    fontFamily: "Menlo",
  },
  amount: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.ink,
    fontFamily: "Georgia",
  },
  meta: {
    marginTop: 4,
    color: theme.colors.muted,
    fontSize: 13,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.ink,
    marginBottom: theme.spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    flexWrap: "wrap",
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: {
    color: theme.colors.white,
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 30,
    marginTop: -2,
  },
});
