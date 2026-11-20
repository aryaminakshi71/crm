/**
 * Platform Tab - Intelligence & integrations hub
 * Shows live counts from Helpdesk, Invoicing, Projects, and HRM.
 */

import { useQuery } from "@tanstack/react-query";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  HeaderBlock,
  Panel,
  Pill,
  Screen,
  SectionLabel,
} from "../../src/components/mobile-ui";
import { useCrmClient } from "../../src/lib/api";
import { useMobileConfig } from "../../src/lib/mobile-config";
import { formatCurrency, formatRelativeDate, theme } from "../../src/lib/theme";

export default function PlatformScreen() {
  const client = useCrmClient();
  const { apiBaseUrl, demoMode, organizationId } = useMobileConfig();
  const cacheScope = [apiBaseUrl, demoMode, organizationId];

  const ticketsQuery = useQuery({
    queryKey: ["mobile", "tickets", ...cacheScope],
    queryFn: client.tickets.list,
  });

  const invoicesQuery = useQuery({
    queryKey: ["mobile", "invoices", ...cacheScope],
    queryFn: client.invoices.list,
  });

  const projectsQuery = useQuery({
    queryKey: ["mobile", "projects", ...cacheScope],
    queryFn: client.projects.list,
  });

  const employeesQuery = useQuery({
    queryKey: ["mobile", "employees", ...cacheScope],
    queryFn: () => client.employees.list(),
  });

  const tickets = ticketsQuery.data?.data ?? [];
  const invoices = invoicesQuery.data?.data ?? [];
  const projects = projectsQuery.data?.data ?? [];
  const employees: any[] = (employeesQuery.data as any)?.data ?? [];

  const openTickets = tickets.filter(
    (t) => t.status !== "closed" && t.status !== "resolved",
  );
  const activeProjects = projects.filter(
    (p) => p.status === "active" || p.status === "in_progress",
  );
  const unpaidInvoices = invoices.filter(
    (i) => i.status === "unpaid" || i.status === "pending" || i.status === "sent",
  );

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <HeaderBlock
          eyebrow="Intelligence hub"
          title="Platform"
          subtitle="Intelligence & integrations — live signals from across Nucleo One."
          sidecar={<Pill label="Live" tone="accent" />}
        />

        {/* Helpdesk */}
        <SectionLabel title="Helpdesk" />
        <Panel accent={theme.colors.danger}>
          <View style={styles.sectionRow}>
            <View style={styles.flex}>
              <Text style={styles.bigNumber}>
                {ticketsQuery.isLoading ? "—" : openTickets.length}
              </Text>
              <Text style={styles.sectionMeta}>
                {ticketsQuery.isLoading
                  ? "Loading tickets..."
                  : `open of ${tickets.length} total tickets`}
              </Text>
            </View>
            <Pill label="Active" tone="accent" />
          </View>
          {openTickets.slice(0, 3).map((ticket) => (
            <View key={ticket.id} style={styles.itemRow}>
              <View style={styles.flex}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {ticket.subject}
                </Text>
                <Text style={styles.itemMeta}>
                  {ticket.priority.toUpperCase()} · {ticket.status} ·{" "}
                  {formatRelativeDate(ticket.createdAt)}
                </Text>
              </View>
              <PriorityDot priority={ticket.priority} />
            </View>
          ))}
          {openTickets.length === 0 && !ticketsQuery.isLoading ? (
            <Text style={styles.emptyNote}>No open tickets — all clear.</Text>
          ) : null}
        </Panel>

        {/* Invoicing */}
        <SectionLabel title="Invoicing" />
        <Panel accent={theme.colors.gold}>
          <View style={styles.sectionRow}>
            <View style={styles.flex}>
              <Text style={styles.bigNumber}>
                {invoicesQuery.isLoading ? "—" : unpaidInvoices.length}
              </Text>
              <Text style={styles.sectionMeta}>
                {invoicesQuery.isLoading
                  ? "Loading invoices..."
                  : `unpaid of ${invoices.length} total invoices`}
              </Text>
            </View>
            <Pill label="Active" tone="accent" />
          </View>
          {invoices.slice(0, 3).map((invoice) => (
            <View key={invoice.id} style={styles.itemRow}>
              <View style={styles.flex}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {invoice.invoiceNumber
                    ? `Invoice #${invoice.invoiceNumber}`
                    : "Invoice"}
                </Text>
                <Text style={styles.itemMeta}>
                  {invoice.status.toUpperCase()} ·{" "}
                  {formatCurrency(invoice.total)}
                  {invoice.dueAt
                    ? ` · due ${formatRelativeDate(invoice.dueAt)}`
                    : ""}
                </Text>
              </View>
              <StatusDot status={invoice.status} />
            </View>
          ))}
          {invoices.length === 0 && !invoicesQuery.isLoading ? (
            <Text style={styles.emptyNote}>No invoices found.</Text>
          ) : null}
        </Panel>

        {/* Projects */}
        <SectionLabel title="Projects" />
        <Panel accent={theme.colors.ocean}>
          <View style={styles.sectionRow}>
            <View style={styles.flex}>
              <Text style={styles.bigNumber}>
                {projectsQuery.isLoading ? "—" : activeProjects.length}
              </Text>
              <Text style={styles.sectionMeta}>
                {projectsQuery.isLoading
                  ? "Loading projects..."
                  : `active of ${projects.length} total projects`}
              </Text>
            </View>
            <Pill label="Active" tone="accent" />
          </View>
          {projects.slice(0, 3).map((project) => (
            <View key={project.id} style={styles.itemRow}>
              <View style={styles.flex}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {project.name}
                </Text>
                <Text style={styles.itemMeta}>
                  {project.status.toUpperCase()} ·{" "}
                  {formatRelativeDate(project.createdAt)}
                </Text>
              </View>
              <StatusDot status={project.status} />
            </View>
          ))}
          {projects.length === 0 && !projectsQuery.isLoading ? (
            <Text style={styles.emptyNote}>No projects found.</Text>
          ) : null}
        </Panel>

        {/* HRM */}
        <SectionLabel title="HRM" />
        <Panel accent={theme.colors.mint}>
          <View style={styles.sectionRow}>
            <View style={styles.flex}>
              <Text style={styles.bigNumber}>
                {employeesQuery.isLoading ? "—" : employees.length}
              </Text>
              <Text style={styles.sectionMeta}>
                {employeesQuery.isLoading
                  ? "Loading employees..."
                  : `employees in the organization`}
              </Text>
            </View>
            <Pill label="Active" tone="accent" />
          </View>
          {employees.slice(0, 3).map((emp: any) => (
            <View key={emp.id} style={styles.itemRow}>
              <View style={styles.flex}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {emp.fullName}
                </Text>
                <Text style={styles.itemMeta}>
                  {[emp.jobTitle, emp.department].filter(Boolean).join(" · ") ||
                    emp.workEmail ||
                    "Employee"}
                </Text>
              </View>
            </View>
          ))}
          {employees.length === 0 && !employeesQuery.isLoading ? (
            <Text style={styles.emptyNote}>No employees found.</Text>
          ) : null}
        </Panel>

        <View style={styles.bottomPad} />
      </ScrollView>
    </Screen>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const color =
    priority === "urgent"
      ? theme.colors.danger
      : priority === "high"
        ? "#f97316"
        : priority === "low"
          ? "#22c55e"
          : theme.colors.ocean;
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "active" || status === "in_progress" || status === "paid"
      ? "#22c55e"
      : status === "closed" || status === "resolved" || status === "cancelled"
        ? theme.colors.muted
        : theme.colors.gold;
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  flex: {
    flex: 1,
  },
  bigNumber: {
    fontSize: 40,
    fontFamily: "Georgia",
    color: theme.colors.ink,
    lineHeight: 44,
  },
  sectionMeta: {
    color: theme.colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.ink,
  },
  itemMeta: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  emptyNote: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
    fontStyle: "italic",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  bottomPad: {
    height: 32,
  },
});
