import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  EmptyState,
  HeaderBlock,
  Screen,
  SectionLabel,
} from "../../src/components/mobile-ui";
import { useCrmClient } from "../../src/lib/api";
import { useMobileConfig } from "../../src/lib/mobile-config";
import type { Notification } from "../../src/lib/types";
import { formatRelativeDate, theme } from "../../src/lib/theme";

const FILTER_TABS = ["All", "Unread", "Mentions"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

function dotColor(type: Notification["type"]): string {
  switch (type) {
    case "success":
      return "#22c55e";
    case "warning":
      return "#f59e0b";
    case "error":
      return theme.colors.danger;
    default:
      return theme.colors.ocean;
  }
}

export default function NotificationsScreen() {
  const client = useCrmClient();
  const { apiBaseUrl, demoMode, organizationId } = useMobileConfig();
  const cacheScope = [apiBaseUrl, demoMode, organizationId];
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");

  const notificationsQuery = useQuery({
    queryKey: ["mobile", "notifications", ...cacheScope],
    queryFn: () => client.notifications.list(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => client.notifications.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile", "notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => client.notifications.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile", "notifications"] });
    },
  });

  const all: Notification[] = notificationsQuery.data?.data ?? [];

  const filtered = all.filter((n) => {
    if (activeFilter === "Unread") return !n.read;
    if (activeFilter === "Mentions") return n.body?.toLowerCase().includes("@");
    return true;
  });

  const unreadCount = all.filter((n) => !n.read).length;

  return (
    <Screen>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={notificationsQuery.isRefetching}
            onRefresh={() => notificationsQuery.refetch()}
            tintColor={theme.colors.accent}
          />
        }
        ListHeaderComponent={
          <View>
            <HeaderBlock
              eyebrow="Activity stream"
              title="Notifications"
              subtitle="Stay on top of updates, mentions, and alerts across the platform."
              sidecar={
                unreadCount > 0 ? (
                  <TouchableOpacity
                    style={styles.markAllBtn}
                    onPress={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                  >
                    <Text style={styles.markAllText}>
                      {markAllReadMutation.isPending ? "Marking..." : "Mark all read"}
                    </Text>
                  </TouchableOpacity>
                ) : null
              }
            />

            {/* Stats bar */}
            <View style={styles.statsBar}>
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                  {all.length}
                </Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: theme.colors.gold }]}>
                  {unreadCount}
                </Text>
                <Text style={styles.statLabel}>Unread</Text>
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

            <SectionLabel
              title={`${filtered.length} notification${filtered.length !== 1 ? "s" : ""}`}
            />
          </View>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              if (!item.read) markReadMutation.mutate(item.id);
            }}
          >
            <View style={[styles.item, !item.read && styles.itemUnread]}>
              {/* Unread indicator — blue left border handled via style above */}
              <View
                style={[
                  styles.dot,
                  { backgroundColor: dotColor(item.type) },
                ]}
              />
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, !item.read && styles.itemTitleUnread]}>
                  {item.title}
                </Text>
                <Text style={styles.itemBody} numberOfLines={2}>
                  {item.body}
                </Text>
                <Text style={styles.itemTime}>
                  {formatRelativeDate(item.createdAt)}
                </Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          notificationsQuery.isLoading ? (
            <View style={styles.loadingWrap}>
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : (
            <EmptyState
              title="No notifications"
              copy="You're all caught up. New alerts and mentions will appear here."
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
  markAllBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.accent,
    letterSpacing: 0.3,
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
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
  },
  itemUnread: {
    borderLeftColor: theme.colors.ocean,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.ink,
    lineHeight: 21,
  },
  itemTitleUnread: {
    fontWeight: "800",
  },
  itemBody: {
    marginTop: 3,
    fontSize: 13,
    color: theme.colors.muted,
    lineHeight: 19,
  },
  itemTime: {
    marginTop: 5,
    fontSize: 11,
    color: theme.colors.muted,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.ocean,
    marginTop: 6,
    flexShrink: 0,
  },
  loadingWrap: {
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  loadingText: {
    color: theme.colors.muted,
    fontSize: 14,
  },
});
