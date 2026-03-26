import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  EmptyState,
  HeaderBlock,
  Panel,
  Screen,
  SectionLabel,
} from "../../src/components/mobile-ui";
import { useCrmClient } from "../../src/lib/api";
import { useMobileConfig } from "../../src/lib/mobile-config";
import { theme } from "../../src/lib/theme";
import type { Employee } from "../../src/lib/types";

type FilterTab = "all" | "active" | "on-leave";

function statusDotColor(status?: string | null) {
  if (status === "active") return "#22c55e";
  if (status === "on_leave" || status === "on-leave") return "#f97316";
  return "#94a3b8";
}

function statusLabel(status?: string | null) {
  if (status === "active") return "Active";
  if (status === "on_leave" || status === "on-leave") return "On Leave";
  if (status === "inactive") return "Inactive";
  return status ?? "Unknown";
}

function getInitial(fullName: string) {
  return fullName.trim().charAt(0).toUpperCase();
}

function matchesFilter(employee: Employee, filter: FilterTab) {
  if (filter === "all") return true;
  const s = employee.status ?? "";
  if (filter === "active") return s === "active";
  if (filter === "on-leave") return s === "on_leave" || s === "on-leave";
  return true;
}

function matchesSearch(employee: Employee, search: string) {
  if (!search.trim()) return true;
  const q = search.toLowerCase();
  return (
    employee.fullName.toLowerCase().includes(q) ||
    (employee.jobTitle ?? "").toLowerCase().includes(q) ||
    (employee.department ?? "").toLowerCase().includes(q)
  );
}

export default function HrmScreen() {
  const client = useCrmClient();
  const { apiBaseUrl, demoMode, organizationId } = useMobileConfig();
  const cacheScope = [apiBaseUrl, demoMode, organizationId];

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");

  const employeesQuery = useQuery({
    queryKey: ["mobile", "hrm-employees", ...cacheScope],
    queryFn: () => client.employees.list(),
  });

  const allEmployees = employeesQuery.data?.data ?? [];

  const totalEmployees = allEmployees.length;
  const onLeaveCount = allEmployees.filter(
    (e) => e.status === "on_leave" || e.status === "on-leave",
  ).length;
  const openPositions = 0; // placeholder — not in current API response

  const filtered = allEmployees.filter(
    (e) => matchesFilter(e, filter) && matchesSearch(e, search),
  );

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "on-leave", label: "On Leave" },
  ];

  return (
    <Screen>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={employeesQuery.isRefetching}
            onRefresh={() => employeesQuery.refetch()}
            tintColor={theme.colors.accent}
          />
        }
        ListHeaderComponent={
          <View>
            <HeaderBlock
              eyebrow="Human Resources"
              title="People"
              subtitle="Browse and search employees across departments."
            />

            {/* Stats bar */}
            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{totalEmployees}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={[styles.statCell, styles.statCellBorder]}>
                <Text style={[styles.statValue, { color: "#f97316" }]}>
                  {onLeaveCount}
                </Text>
                <Text style={styles.statLabel}>On Leave</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                  {openPositions}
                </Text>
                <Text style={styles.statLabel}>Open Roles</Text>
              </View>
            </View>

            {/* Search input */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search employees..."
              placeholderTextColor={theme.colors.muted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />

            {/* Filter tabs */}
            <View style={styles.filterRow}>
              {filterTabs.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.filterTab,
                    filter === tab.key && styles.filterTabActive,
                  ]}
                  onPress={() => setFilter(tab.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      filter === tab.key && styles.filterTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <SectionLabel title={`${filtered.length} employee${filtered.length !== 1 ? "s" : ""}`} />
          </View>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }: { item: Employee }) => (
          <View style={styles.employeeCard}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.colors.accent + "22" },
              ]}
            >
              <Text style={styles.avatarText}>{getInitial(item.fullName)}</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.nameRow}>
                <Text style={styles.employeeName}>{item.fullName}</Text>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: statusDotColor(item.status) },
                  ]}
                />
              </View>
              {item.jobTitle ? (
                <Text style={styles.jobTitle}>{item.jobTitle}</Text>
              ) : null}
              {item.department ? (
                <View style={styles.deptBadgeWrap}>
                  <View style={styles.deptBadge}>
                    <Text style={styles.deptBadgeText}>{item.department}</Text>
                  </View>
                </View>
              ) : null}
              {item.workEmail ? (
                <Text style={styles.meta}>{item.workEmail}</Text>
              ) : null}
            </View>
          </View>
        )}
        ListEmptyComponent={
          employeesQuery.isLoading ? (
            <Panel accent={theme.colors.mint}>
              <Text style={styles.meta}>Loading employees...</Text>
            </Panel>
          ) : (
            <EmptyState
              title="No employees found"
              copy="Try adjusting your search or filter to find who you're looking for."
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
  searchInput: {
    backgroundColor: theme.colors.paper,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.ink,
    marginBottom: theme.spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.paper,
  },
  filterTabActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.muted,
  },
  filterTabTextActive: {
    color: theme.colors.white,
  },
  employeeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: theme.colors.paper,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.accent,
  },
  cardBody: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.ink,
    flex: 1,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginLeft: 8,
    flexShrink: 0,
  },
  jobTitle: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: 4,
  },
  deptBadgeWrap: {
    flexDirection: "row",
    marginBottom: 4,
  },
  deptBadge: {
    backgroundColor: theme.colors.ocean + "22",
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  deptBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.ocean,
  },
  meta: {
    fontSize: 12,
    color: theme.colors.muted,
  },
});
