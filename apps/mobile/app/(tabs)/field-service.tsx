import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  EmptyState,
  HeaderBlock,
  Panel,
  Pill,
  Screen,
  SectionLabel,
} from "../../src/components/mobile-ui";
import { useCrmClient } from "../../src/lib/api";
import { useMobileConfig } from "../../src/lib/mobile-config";
import { theme } from "../../src/lib/theme";
import type { FieldServiceJob } from "../../src/lib/types";

function statusTone(status: string): "accent" | "muted" | "danger" {
  if (status === "in_progress") return "accent";
  if (status === "completed") return "muted";
  if (status === "canceled") return "danger";
  return "muted";
}

function statusBorderColor(status: string) {
  switch (status) {
    case "in_progress":
      return theme.colors.accent;
    case "completed":
      return "#22c55e";
    case "canceled":
      return theme.colors.danger;
    case "on_hold":
      return theme.colors.gold;
    default:
      return theme.colors.ocean;
  }
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatTodayFull() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function isToday(dateStr?: string | null) {
  if (!dateStr) return false;
  return dateStr.slice(0, 10) === todayISO();
}

function computeJobStats(jobs: FieldServiceJob[]) {
  const todayJobs = jobs.filter(
    (j) => isToday(j.scheduledStart) || isToday(j.createdAt),
  );
  const completed = todayJobs.filter((j) => j.status === "completed").length;
  const remaining = todayJobs.filter(
    (j) => j.status === "scheduled" || j.status === "in_progress",
  ).length;
  return { total: todayJobs.length, completed, remaining };
}

function openMaps(address?: string | null, lat?: number, lng?: number) {
  if (lat && lng) {
    const url = `https://maps.apple.com/?daddr=${lat},${lng}`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      ),
    );
    return;
  }
  if (address) {
    const encoded = encodeURIComponent(address);
    Linking.openURL(`https://maps.apple.com/?daddr=${encoded}`).catch(() =>
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${encoded}`,
      ),
    );
  }
}

export default function FieldServiceScreen() {
  const client = useCrmClient();
  const { apiBaseUrl, demoMode, organizationId } = useMobileConfig();
  const cacheScope = [apiBaseUrl, demoMode, organizationId];
  const queryClient = useQueryClient();

  const jobsQuery = useQuery({
    queryKey: ["mobile", "field-service-jobs", todayISO(), ...cacheScope],
    queryFn: () => client.fieldServiceJobs.list({ date: todayISO() }),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => client.fieldServiceJobs.start(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["mobile", "field-service-jobs"],
      });
    },
    onError: (error) => {
      Alert.alert("Could not start job", error.message);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => client.fieldServiceJobs.complete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["mobile", "field-service-jobs"],
      });
    },
    onError: (error) => {
      Alert.alert("Could not complete job", error.message);
    },
  });

  const allJobs = jobsQuery.data?.data ?? [];
  const todayJobs = allJobs.filter(
    (j) => isToday(j.scheduledStart) || isToday(j.createdAt),
  );
  const stats = computeJobStats(allJobs);

  const isPending = startMutation.isPending || completeMutation.isPending;

  return (
    <Screen>
      <FlatList
        data={todayJobs}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={jobsQuery.isRefetching}
            onRefresh={() => jobsQuery.refetch()}
            tintColor={theme.colors.accent}
          />
        }
        ListHeaderComponent={
          <View>
            <HeaderBlock
              eyebrow={formatTodayFull()}
              title="Field Service"
              subtitle="Your scheduled jobs for today. Navigate, start, and close out work orders from the field."
            />
            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Today</Text>
              </View>
              <View style={[styles.statCell, styles.statCellBorder]}>
                <Text style={[styles.statValue, { color: "#22c55e" }]}>
                  {stats.completed}
                </Text>
                <Text style={styles.statLabel}>Done</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                  {stats.remaining}
                </Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
            </View>
            <SectionLabel title={`${todayJobs.length} jobs today`} />
          </View>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const address =
            item.location?.address ?? item.customerAddress ?? null;
          const lat = item.location?.lat;
          const lng = item.location?.lng;
          const canStart = item.status === "scheduled";
          const canComplete = item.status === "in_progress";

          return (
            <View style={[styles.jobCard, { borderLeftColor: statusBorderColor(item.status) }]}>
              <View style={styles.cardHeader}>
                <View style={styles.flex}>
                  <Text style={styles.jobNumber}>{item.jobNumber}</Text>
                  <Text style={styles.jobTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
                <Pill
                  label={formatStatusLabel(item.status)}
                  tone={statusTone(item.status)}
                />
              </View>

              {item.customerName ? (
                <Text style={styles.customer}>{item.customerName}</Text>
              ) : null}

              {address ? (
                <Text style={styles.address} numberOfLines={2}>
                  {address}
                </Text>
              ) : null}

              {item.scheduledStart ? (
                <Text style={styles.meta}>
                  {new Date(item.scheduledStart).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {item.scheduledEnd
                    ? ` – ${new Date(item.scheduledEnd).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}`
                    : ""}
                  {item.estimatedDuration
                    ? `  ·  ${item.estimatedDuration} min`
                    : ""}
                </Text>
              ) : null}

              <View style={styles.actions}>
                {address || (lat && lng) ? (
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => openMaps(address, lat, lng)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.navButtonText}>Navigate</Text>
                  </TouchableOpacity>
                ) : null}

                {canStart ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.startButton]}
                    onPress={() => startMutation.mutate(item.id)}
                    disabled={isPending}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionButtonText}>
                      {startMutation.isPending ? "Starting..." : "Start Job"}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {canComplete ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => completeMutation.mutate(item.id)}
                    disabled={isPending}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionButtonText}>
                      {completeMutation.isPending ? "Completing..." : "Complete Job"}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          jobsQuery.isLoading ? (
            <Panel accent={theme.colors.mint}>
              <Text style={styles.meta}>Loading today's jobs...</Text>
            </Panel>
          ) : (
            <EmptyState
              title="No jobs today"
              copy="Your schedule is clear. New work orders assigned to you will appear here."
            />
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 32,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: theme.colors.paper,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  statCellBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.ink,
    fontFamily: "Georgia",
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  jobCard: {
    backgroundColor: theme.colors.paper,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 5,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  flex: {
    flex: 1,
  },
  jobNumber: {
    fontSize: 12,
    fontFamily: "Menlo",
    color: theme.colors.muted,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.ink,
    lineHeight: 22,
  },
  customer: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.ink,
    marginBottom: 2,
  },
  address: {
    fontSize: 13,
    color: theme.colors.muted,
    lineHeight: 18,
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    flexWrap: "wrap",
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.ocean,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.ocean,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
  },
  startButton: {
    backgroundColor: theme.colors.accent,
  },
  completeButton: {
    backgroundColor: "#22c55e",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.white,
  },
});
