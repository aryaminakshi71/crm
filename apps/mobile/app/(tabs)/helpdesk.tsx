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
  Panel,
  Pill,
  PrimaryButton,
  Screen,
  SectionLabel,
  Sheet,
} from "../../src/components/mobile-ui";
import { useCrmClient } from "../../src/lib/api";
import { useMobileConfig } from "../../src/lib/mobile-config";
import { formatRelativeDate, getInitials, theme } from "../../src/lib/theme";

const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
type Priority = (typeof PRIORITIES)[number];

const FILTER_TABS = ["All", "Open", "Pending", "Closed"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

function priorityColor(priority: string) {
  switch (priority) {
    case "urgent":
      return theme.colors.danger;
    case "high":
      return "#f97316";
    case "low":
      return "#22c55e";
    default:
      return theme.colors.ocean;
  }
}

function priorityAccent(priority: string) {
  switch (priority) {
    case "urgent":
      return theme.colors.danger;
    case "high":
      return "#f97316";
    case "low":
      return theme.colors.mint;
    default:
      return theme.colors.ocean;
  }
}

function statusTone(
  status: string,
): "accent" | "muted" | "danger" {
  if (status === "open" || status === "pending") return "accent";
  if (status === "urgent") return "danger";
  return "muted";
}

export default function HelpdeskScreen() {
  const client = useCrmClient();
  const { apiBaseUrl, demoMode, organizationId } = useMobileConfig();
  const cacheScope = [apiBaseUrl, demoMode, organizationId];
  const queryClient = useQueryClient();

  const [showComposer, setShowComposer] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");

  const ticketsQuery = useQuery({
    queryKey: ["mobile", "tickets", ...cacheScope],
    queryFn: client.tickets.list,
  });

  const createMutation = useMutation({
    mutationFn: client.tickets.create,
    onSuccess: async () => {
      setShowComposer(false);
      setSubject("");
      setDescription("");
      setPriority("normal");
      await queryClient.invalidateQueries({ queryKey: ["mobile", "tickets"] });
    },
    onError: (error) => {
      Alert.alert("Could not create ticket", error.message);
    },
  });

  const allTickets = ticketsQuery.data?.data ?? [];

  const tickets = allTickets.filter((t) => {
    if (activeFilter === "All") return true;
    return t.status.toLowerCase() === activeFilter.toLowerCase();
  });

  const openCount = allTickets.filter((t) => t.status.toLowerCase() === "open").length;
  const pendingCount = allTickets.filter((t) => t.status.toLowerCase() === "pending").length;

  return (
    <Screen>
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={ticketsQuery.isRefetching}
            onRefresh={() => ticketsQuery.refetch()}
            tintColor={theme.colors.accent}
          />
        }
        ListHeaderComponent={
          <View>
            <HeaderBlock
              eyebrow="Support queue"
              title="Helpdesk"
              subtitle="Track and resolve support tickets across the organization."
              sidecar={
                <PrimaryButton
                  label="New ticket"
                  onPress={() => setShowComposer(true)}
                />
              }
            />
            {/* Stats bar */}
            <View style={styles.statsBar}>
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: theme.colors.danger }]}>{openCount}</Text>
                <Text style={styles.statLabel}>Open</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: "#f97316" }]}>{pendingCount}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
            {/* Filter tabs */}
            <View style={styles.filterRow}>
              {FILTER_TABS.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.filterTab,
                    activeFilter === tab && styles.filterTabActive,
                  ]}
                  onPress={() => setActiveFilter(tab)}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      activeFilter === tab && styles.filterTabTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <SectionLabel title={`${tickets.length} ticket${tickets.length !== 1 ? "s" : ""}`} />
          </View>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Panel accent={priorityAccent(item.priority)}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(item.subject || "TK")}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.ticketSubject} numberOfLines={2}>
                  {item.subject}
                </Text>
                <Text style={styles.meta}>
                  {formatRelativeDate(item.createdAt)}
                </Text>
              </View>
              <View style={styles.badges}>
                <Pill label={item.status} tone={statusTone(item.status)} />
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: priorityColor(item.priority) },
                  ]}
                >
                  <Text style={styles.priorityBadgeText}>
                    {item.priority.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            {item.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </Panel>
        )}
        ListEmptyComponent={
          ticketsQuery.isLoading ? (
            <Panel accent={theme.colors.mint}>
              <Text style={styles.meta}>Loading tickets...</Text>
            </Panel>
          ) : (
            <EmptyState
              title="No tickets yet"
              copy="File a support request and it will appear here for your team to triage and resolve."
            />
          )
        }
        showsVerticalScrollIndicator={false}
      />

      <Sheet
        visible={showComposer}
        title="File a ticket"
        subtitle="Submit a new support request and assign an initial priority."
        onClose={() => setShowComposer(false)}
      >
        <Field
          label="Subject"
          value={subject}
          onChangeText={setSubject}
          placeholder="Login broken for new user · API rate limit hit"
        />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the issue and any steps to reproduce..."
          multiline
        />
        <Text style={styles.priorityLabel}>Priority</Text>
        <View style={styles.priorityRow}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.priorityChip,
                { borderColor: priorityColor(p) },
                priority === p && {
                  backgroundColor: priorityColor(p),
                },
              ]}
              onPress={() => setPriority(p)}
            >
              <Text
                style={[
                  styles.priorityChipText,
                  { color: priority === p ? theme.colors.white : priorityColor(p) },
                ]}
              >
                {p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <PrimaryButton
          label={createMutation.isPending ? "Filing ticket..." : "File ticket"}
          onPress={() =>
            createMutation.mutate({ subject, description, priority })
          }
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 32,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.ink,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Menlo",
  },
  flex: {
    flex: 1,
  },
  badges: {
    gap: theme.spacing.xs,
    alignItems: "flex-end",
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.ink,
    lineHeight: 22,
  },
  meta: {
    marginTop: 3,
    color: theme.colors.muted,
    fontSize: 13,
  },
  description: {
    marginTop: theme.spacing.sm,
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.white,
    letterSpacing: 0.4,
  },
  priorityLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.ink,
    marginBottom: theme.spacing.sm,
  },
  priorityRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    flexWrap: "wrap",
  },
  priorityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
  },
  priorityChipText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  statsBar: {
    flexDirection: "row",
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.ink,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    fontFamily: "Menlo",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.muted,
    opacity: 0.2,
    alignSelf: "stretch",
  },
  filterRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  filterTab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    borderColor: "transparent",
    backgroundColor: theme.colors.ink,
  },
  filterTabActive: {
    borderColor: theme.colors.accent,
    backgroundColor: `${theme.colors.accent}18`,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.muted,
    letterSpacing: 0.3,
  },
  filterTabTextActive: {
    color: theme.colors.accent,
  },
});
