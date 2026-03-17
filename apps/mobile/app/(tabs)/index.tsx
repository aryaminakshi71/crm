import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import {
  HeaderBlock,
  MetricCard,
  Panel,
  Pill,
  Screen,
  SectionLabel,
} from "../../src/components/mobile-ui";
import { useCrmClient } from "../../src/lib/api";
import { useMobileConfig } from "../../src/lib/mobile-config";
import {
  formatCurrency,
  formatPersonName,
  formatRelativeDate,
  theme,
} from "../../src/lib/theme";

export default function HomeScreen() {
  const client = useCrmClient();
  const { apiBaseUrl, demoMode, organizationId } = useMobileConfig();
  const cacheScope = [apiBaseUrl, demoMode, organizationId];
  const contactsQuery = useQuery({
    queryKey: ["mobile", "contacts", ...cacheScope],
    queryFn: client.contacts.list,
  });
  const leadsQuery = useQuery({
    queryKey: ["mobile", "leads", ...cacheScope],
    queryFn: client.leads.list,
  });
  const dealsQuery = useQuery({
    queryKey: ["mobile", "deals", ...cacheScope],
    queryFn: client.deals.list,
  });
  const activitiesQuery = useQuery({
    queryKey: ["mobile", "activities", ...cacheScope],
    queryFn: client.activities.list,
  });

  const contacts = contactsQuery.data?.data ?? [];
  const leads = leadsQuery.data?.data ?? [];
  const deals = dealsQuery.data?.data ?? [];
  const activities = activitiesQuery.data?.data ?? [];
  const openDeals = deals.filter((deal) => deal.stage !== "won");
  const pipelineValue = openDeals.reduce(
    (sum, deal) => sum + Number(deal.value ?? 0),
    0,
  );

  return (
    <Screen scroll>
      <HeaderBlock
        eyebrow="Native command deck"
        title="Nucleo on the move"
        subtitle="A field-ready mobile view of the live app. Use this on iPhone or Android with the same API the web app uses."
        sidecar={<Pill label="Live sync" tone="accent" />}
      />

      <View style={styles.metricsRow}>
        <MetricCard
          label="Contacts"
          value={String(contacts.length)}
          note="Portable relationship memory"
        />
        <MetricCard
          label="Open pipeline"
          value={formatCurrency(pipelineValue)}
          note={`${openDeals.length} active deals`}
        />
      </View>
      <View style={styles.metricsRow}>
        <MetricCard
          label="Fresh leads"
          value={String(
            leads.filter((lead) => lead.status !== "converted").length,
          )}
          note="Ready for follow-up"
        />
        <MetricCard
          label="Recent activity"
          value={String(activities.length)}
          note="Calls, notes, and next steps"
        />
      </View>

      <SectionLabel title="Pipeline pulse" />
      <Panel accent={theme.colors.accent}>
        <Text style={styles.panelTitle}>What needs attention first</Text>
        <Text style={styles.panelCopy}>
          {openDeals.length > 0
            ? `${openDeals[0]?.name ?? "Latest opportunity"} is still active. Keep deal momentum visible for the team outside the office.`
            : "No open deals yet. Create one from the Pipeline tab and this radar view will update automatically."}
        </Text>
      </Panel>

      <SectionLabel title="Newest contacts" />
      {contacts.slice(0, 3).map((contact) => (
        <Panel key={contact.id} accent={theme.colors.ocean}>
          <View style={styles.row}>
            <View>
              <Text style={styles.itemTitle}>
                {formatPersonName(contact.firstName, contact.lastName)}
              </Text>
              <Text style={styles.itemMeta}>
                {contact.companyName || contact.email || "No company yet"}
              </Text>
            </View>
            <Pill label={formatRelativeDate(contact.createdAt)} />
          </View>
        </Panel>
      ))}

      <SectionLabel title="Recent activity" />
      {activities.slice(0, 3).map((activity) => (
        <Panel key={activity.id} accent={theme.colors.gold}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.itemTitle}>
                {activity.title || activity.subject || "Untitled activity"}
              </Text>
              <Text style={styles.itemMeta}>
                {(activity.type || "note").toUpperCase()} ·{" "}
                {formatRelativeDate(activity.createdAt)}
              </Text>
            </View>
            <Pill label={activity.type || "note"} tone="accent" />
          </View>
          {activity.description ? (
            <Text style={styles.description}>{activity.description}</Text>
          ) : null}
        </Panel>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  panelTitle: {
    fontSize: 20,
    color: theme.colors.ink,
    fontFamily: "Georgia",
    marginBottom: theme.spacing.xs,
  },
  panelCopy: {
    color: theme.colors.muted,
    lineHeight: 20,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  flex: {
    flex: 1,
  },
  itemTitle: {
    color: theme.colors.ink,
    fontSize: 17,
    fontWeight: "700",
  },
  itemMeta: {
    color: theme.colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  description: {
    marginTop: theme.spacing.sm,
    color: theme.colors.muted,
    lineHeight: 20,
  },
});
