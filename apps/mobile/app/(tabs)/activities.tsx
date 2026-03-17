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

export default function ActivitiesScreen() {
  const client = useCrmClient();
  const { apiBaseUrl, demoMode, organizationId } = useMobileConfig();
  const cacheScope = [apiBaseUrl, demoMode, organizationId];
  const queryClient = useQueryClient();
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState("");
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
      setTitle("");
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

  const activities = activitiesQuery.data?.data ?? [];

  return (
    <Screen>
      <FlatList
        data={activities}
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
              subtitle="Calls, emails, and notes stay visible for teams working from the field."
              sidecar={
                <PrimaryButton
                  label="New activity"
                  onPress={() => setShowComposer(true)}
                />
              }
            />
            <SectionLabel title="Recent motion" />
          </View>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Panel accent={theme.colors.gold}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.title}>
                  {item.title || item.subject || "Untitled activity"}
                </Text>
                <Text style={styles.meta}>
                  {formatRelativeDate(item.createdAt)} ·{" "}
                  {(item.type || "note").toUpperCase()}
                </Text>
              </View>
              <Pill label={item.type || "note"} tone="accent" />
            </View>
            {item.description ? (
              <Text style={styles.description}>{item.description}</Text>
            ) : null}
          </Panel>
        )}
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
        subtitle="Keep the mobile timeline alive with notes, calls, or meetings."
        onClose={() => setShowComposer(false)}
      >
        <Field
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Investor callback"
        />
        <Field
          label="Type"
          value={type}
          onChangeText={setType}
          placeholder="call, meeting, note"
        />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="What happened?"
          multiline
        />
        <PrimaryButton
          label={createMutation.isPending ? "Saving..." : "Save activity"}
          onPress={() =>
            createMutation.mutate({
              title,
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
});
