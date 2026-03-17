import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
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
import { formatCurrency, formatPersonName, theme } from "../../src/lib/theme";

export default function PipelineScreen() {
  const client = useCrmClient();
  const { apiBaseUrl, demoMode, organizationId } = useMobileConfig();
  const cacheScope = [apiBaseUrl, demoMode, organizationId];
  const queryClient = useQueryClient();
  const [showLeadComposer, setShowLeadComposer] = useState(false);
  const [showDealComposer, setShowDealComposer] = useState(false);
  const [leadFirstName, setLeadFirstName] = useState("");
  const [leadLastName, setLeadLastName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadSource, setLeadSource] = useState("website");
  const [dealName, setDealName] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [dealStage, setDealStage] = useState("lead");
  const [dealProbability, setDealProbability] = useState("50");

  const leadsQuery = useQuery({
    queryKey: ["mobile", "leads", ...cacheScope],
    queryFn: client.leads.list,
  });
  const dealsQuery = useQuery({
    queryKey: ["mobile", "deals", ...cacheScope],
    queryFn: client.deals.list,
  });

  const createLeadMutation = useMutation({
    mutationFn: client.leads.create,
    onSuccess: async () => {
      setShowLeadComposer(false);
      setLeadFirstName("");
      setLeadLastName("");
      setLeadEmail("");
      setLeadCompany("");
      setLeadSource("website");
      await queryClient.invalidateQueries({ queryKey: ["mobile", "leads"] });
    },
    onError: (error) => Alert.alert("Could not create lead", error.message),
  });

  const createDealMutation = useMutation({
    mutationFn: client.deals.create,
    onSuccess: async () => {
      setShowDealComposer(false);
      setDealName("");
      setDealValue("");
      setDealStage("lead");
      setDealProbability("50");
      await queryClient.invalidateQueries({ queryKey: ["mobile", "deals"] });
    },
    onError: (error) => Alert.alert("Could not create deal", error.message),
  });

  const leads = leadsQuery.data?.data ?? [];
  const deals = dealsQuery.data?.data ?? [];
  const pipelineValue = deals.reduce(
    (sum, deal) => sum + Number(deal.value ?? 0),
    0,
  );

  return (
    <Screen scroll>
      <HeaderBlock
        eyebrow="Revenue motion"
        title="Pipeline"
        subtitle="Track who is warm, who is active, and which opportunities need a push."
        sidecar={
          <View style={styles.headerActions}>
            <PrimaryButton
              label="Lead"
              onPress={() => setShowLeadComposer(true)}
            />
          </View>
        }
      />

      <View style={styles.heroStrip}>
        <Panel accent={theme.colors.accent}>
          <Text style={styles.heroLabel}>Total pipeline</Text>
          <Text style={styles.heroValue}>{formatCurrency(pipelineValue)}</Text>
          <Text style={styles.heroMeta}>{deals.length} deal records</Text>
        </Panel>
        <Panel accent={theme.colors.ocean}>
          <Text style={styles.heroLabel}>Unconverted leads</Text>
          <Text style={styles.heroValue}>
            {leads.filter((lead) => lead.status !== "converted").length}
          </Text>
          <Text style={styles.heroMeta}>Ready for outreach</Text>
        </Panel>
      </View>

      <SectionLabel
        title="Lead list"
        action={
          <PrimaryButton
            label="New lead"
            onPress={() => setShowLeadComposer(true)}
          />
        }
      />
      {leads.length === 0 ? (
        <EmptyState
          title="Lead list is empty"
          copy="Capture inbound interest here and graduate qualified people into full deals later."
        />
      ) : (
        leads.slice(0, 5).map((lead) => (
          <Panel key={lead.id} accent={theme.colors.gold}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.itemTitle}>
                  {formatPersonName(lead.firstName, lead.lastName)}
                </Text>
                <Text style={styles.itemMeta}>
                  {lead.companyName || lead.email || "No company yet"}
                </Text>
              </View>
              <Pill label={lead.status || "new"} tone="accent" />
            </View>
          </Panel>
        ))
      )}

      <SectionLabel
        title="Deal board"
        action={
          <PrimaryButton
            label="New deal"
            onPress={() => setShowDealComposer(true)}
          />
        }
      />
      {deals.length === 0 ? (
        <EmptyState
          title="No deals in motion"
          copy="Open a deal from mobile during a meeting and keep the pipeline current before you get back to your desk."
        />
      ) : (
        deals.slice(0, 5).map((deal) => (
          <Panel key={deal.id} accent={theme.colors.ocean}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.itemTitle}>{deal.name}</Text>
                <Text style={styles.itemMeta}>
                  {formatCurrency(deal.value)}
                </Text>
              </View>
              <Pill label={deal.stage || "lead"} />
            </View>
          </Panel>
        ))
      )}

      <Sheet
        visible={showLeadComposer}
        title="Create a lead"
        subtitle="This is optimized for fast entry from a phone."
        onClose={() => setShowLeadComposer(false)}
      >
        <Field
          label="First name"
          value={leadFirstName}
          onChangeText={setLeadFirstName}
          placeholder="Lena"
        />
        <Field
          label="Last name"
          value={leadLastName}
          onChangeText={setLeadLastName}
          placeholder="Patel"
        />
        <Field
          label="Email"
          value={leadEmail}
          onChangeText={setLeadEmail}
          placeholder="lena@buyer.com"
          keyboardType="email-address"
        />
        <Field
          label="Company"
          value={leadCompany}
          onChangeText={setLeadCompany}
          placeholder="Brightforge"
        />
        <Field
          label="Source"
          value={leadSource}
          onChangeText={setLeadSource}
          placeholder="website"
        />
        <PrimaryButton
          label={createLeadMutation.isPending ? "Saving..." : "Save lead"}
          onPress={() =>
            createLeadMutation.mutate({
              firstName: leadFirstName,
              lastName: leadLastName,
              email: leadEmail,
              companyName: leadCompany,
              source: leadSource,
              status: "new",
            })
          }
        />
      </Sheet>

      <Sheet
        visible={showDealComposer}
        title="Open a deal"
        subtitle="Capture revenue at the moment the conversation becomes real."
        onClose={() => setShowDealComposer(false)}
      >
        <Field
          label="Deal name"
          value={dealName}
          onChangeText={setDealName}
          placeholder="Acme annual renewal"
        />
        <Field
          label="Value"
          value={dealValue}
          onChangeText={setDealValue}
          placeholder="25000"
          keyboardType="numeric"
        />
        <Field
          label="Stage"
          value={dealStage}
          onChangeText={setDealStage}
          placeholder="proposal"
        />
        <Field
          label="Probability"
          value={dealProbability}
          onChangeText={setDealProbability}
          placeholder="50"
          keyboardType="numeric"
        />
        <PrimaryButton
          label={createDealMutation.isPending ? "Saving..." : "Save deal"}
          onPress={() =>
            createDealMutation.mutate({
              name: dealName,
              value: Number(dealValue || 0),
              stage: dealStage,
              probability: Number(dealProbability || 50),
            })
          }
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    minWidth: 86,
  },
  heroStrip: {
    marginBottom: theme.spacing.sm,
  },
  heroLabel: {
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
  },
  heroValue: {
    marginTop: theme.spacing.sm,
    color: theme.colors.ink,
    fontFamily: "Georgia",
    fontSize: 30,
    lineHeight: 34,
  },
  heroMeta: {
    marginTop: 4,
    color: theme.colors.muted,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  flex: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    color: theme.colors.ink,
    fontWeight: "700",
  },
  itemMeta: {
    color: theme.colors.muted,
    marginTop: 4,
  },
});
