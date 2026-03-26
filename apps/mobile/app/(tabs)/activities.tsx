import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
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
import { formatRelativeDate, theme } from "../../src/lib/theme";

const ACTIVITY_TYPES = ["call", "email", "meeting", "note"];

function typeTone(type: string): "accent" | "muted" | "danger" {
  if (type === "call") return "accent";
  if (type === "meeting") return "danger";
  return "muted";
}

export default function ActivitiesScreen() {
  const client = useCrmClient();
  const { apiBaseUrl, demoMode, organizationId } = useMobileConfig();
  const cacheScope = [apiBaseUrl, demoMode, organizationId];
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("call");
  const [description, setDescription] = useState("");

  const activitiesQuery = useQuery({
    queryKey: ["mobile", "activities", ...cacheScope],
    queryFn: client.activities.list,
  });

  const createMutation = useMutation({
    mutationFn: client.activities.create,
    onSuccess: async () => {
      setShowComposer(false);
      setSubject("");
      setType("call");
      setDescription("");
      await queryClient.invalidateQueries({
        queryKey: ["mobile", "activities"],
      });
    },
    onError: (error) => {
      Alert.alert("Could not create activity", error.message);
    },
  });

  const allActivities = activitiesQuery.data?.data ?? [];

  const filtered = allActivities.filter((item) => {
    const haystack = [item.title, item.subject, item.type, item.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  return (
    <Screen>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={activitiesQuery.isRefetching}
            onRefresh={() => activitiesQuery.refetch()}
            tintColor={theme.colors.accent}
          />
        }
        ListHeaderComponent={
          <View>
            <HeaderBlock
              eyebrow="Signal log"
              title="Activity feed"
              subtitle="Calls, emails, meetings, and notes stay visible for teams working from the field."
              sidecar={
                <PrimaryButton
                  label="New activity"
                  onPress={() => setShowComposer(true)}
                />
              }
            />
            <Field
              label="Filter"
              value={search}
              onChangeText={setSearch}
              placeholder="Search by subject, type, or note"
            />
            <SectionLabel title={`${filtered.length} activities in view`} />
          </View>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const activityType = item.type || "note";
          return (
            <Panel accent={theme.colors.gold}>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text style={styles.title}>
                    {item.title || item.subject || "Untitled activity"}
                  </Text>
                  <Text style={styles.meta}>
                    {formatRelativeDate(item.createdAt)} ·{" "}
                    {activityType.toUpperCase()}
                  </Text>
                </View>
                <Pill label={activityType} tone={typeTone(activityType)} />
              </View>
              {item.description ? (
                <Text style={styles.description}>{item.description}</Text>
              ) : null}
            </Panel>
          );
        }}
        ListEmptyComponent={
          activitiesQuery.isLoading ? (
            <Panel accent={theme.colors.mint}>
              <Text style={styles.meta}>Loading activity feed...</Text>
            </Panel>
          ) : (
            <EmptyState
              title="No activity yet"
              copy="Log calls, send follow-up notes, or capture meeting outcomes from the phone."
            />
          )
        }
        showsVerticalScrollIndicator={false}
      />

      <Sheet
        visible={showComposer}
        title="Capture field activity"
        subtitle="Keep the mobile timeline alive with notes, calls, meetings, or emails."
        onClose={() => setShowComposer(false)}
      >
        <Field
          label="Subject"
          value={subject}
          onChangeText={setSubject}
          placeholder="Investor callback · Demo scheduled"
        />
        <View style={styles.typeRow}>
          {ACTIVITY_TYPES.map((t) => (
            <View key={t} style={styles.typeButtonWrap}>
              <PrimaryButton
                label={t}
                onPress={() => setType(t)}
              />
              {type === t ? <View style={styles.typeUnderline} /> : null}
            </View>
          ))}
        </View>
        <Field
          label="Type"
          value={type}
          onChangeText={setType}
          placeholder="call, email, meeting, note"
        />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="What happened? Key outcomes, follow-ups, blockers..."
          multiline
        />
        <PrimaryButton
          label={createMutation.isPending ? "Saving..." : "Save activity"}
          onPress={() =>
            createMutation.mutate({
              title: subject,
              type,
              description,
            })
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
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  flex: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.ink,
  },
  meta: {
    marginTop: 4,
    color: theme.colors.muted,
    fontSize: 13,
  },
  description: {
    marginTop: theme.spacing.sm,
    color: theme.colors.muted,
    lineHeight: 20,
  },
  typeRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    flexWrap: "wrap",
  },
  typeButtonWrap: {
    flex: 1,
    minWidth: "22%",
  },
  typeUnderline: {
    height: 3,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    marginTop: 4,
  },
});
