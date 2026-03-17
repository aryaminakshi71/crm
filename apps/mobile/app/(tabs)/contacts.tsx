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
import {
  formatPersonName,
  formatRelativeDate,
  getInitials,
  theme,
} from "../../src/lib/theme";

export default function ContactsScreen() {
  const client = useCrmClient();
  const { apiBaseUrl, demoMode, organizationId } = useMobileConfig();
  const cacheScope = [apiBaseUrl, demoMode, organizationId];
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");

  const contactsQuery = useQuery({
    queryKey: ["mobile", "contacts", ...cacheScope],
    queryFn: client.contacts.list,
  });

  const createMutation = useMutation({
    mutationFn: client.contacts.create,
    onSuccess: async () => {
      setShowComposer(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setCompanyName("");
      await queryClient.invalidateQueries({ queryKey: ["mobile", "contacts"] });
    },
    onError: (error) => {
      Alert.alert("Could not create contact", error.message);
    },
  });

  const filteredContacts = (contactsQuery.data?.data ?? []).filter(
    (contact) => {
      const haystack = [
        contact.firstName,
        contact.lastName,
        contact.email,
        contact.companyName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search.trim().toLowerCase());
    },
  );

  return (
    <Screen>
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={contactsQuery.isRefetching}
            onRefresh={() => contactsQuery.refetch()}
            tintColor={theme.colors.accent}
          />
        }
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <HeaderBlock
              eyebrow="Relationship memory"
              title="Contacts"
              subtitle="The mobile rolodex for operators, founders, and account teams."
              sidecar={
                <PrimaryButton
                  label="New contact"
                  onPress={() => setShowComposer(true)}
                />
              }
            />
            <Field
              label="Filter"
              value={search}
              onChangeText={setSearch}
              placeholder="Search name, company, or email"
            />
            <SectionLabel title={`${filteredContacts.length} people in view`} />
          </View>
        }
        renderItem={({ item }) => {
          const fullName = formatPersonName(item.firstName, item.lastName);
          return (
            <Panel accent={theme.colors.ocean}>
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(fullName)}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.name}>{fullName}</Text>
                  <Text style={styles.meta}>
                    {item.companyName ||
                      item.email ||
                      "No company or email yet"}
                  </Text>
                  {item.phone ? (
                    <Text style={styles.meta}>{item.phone}</Text>
                  ) : null}
                </View>
                <Pill label={formatRelativeDate(item.createdAt)} />
              </View>
            </Panel>
          );
        }}
        ListEmptyComponent={
          contactsQuery.isLoading ? (
            <Panel accent={theme.colors.mint}>
              <Text style={styles.meta}>Loading contacts...</Text>
            </Panel>
          ) : (
            <EmptyState
              title="No contacts yet"
              copy="Add the first person from mobile and the web app will pick it up through the same API."
            />
          )
        }
      />

      <Sheet
        visible={showComposer}
        title="Add a contact"
        subtitle="Fast capture for meetings, conferences, or inbound calls."
        onClose={() => setShowComposer(false)}
      >
        <Field
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Amina"
        />
        <Field
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Shah"
        />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="amina@company.com"
          keyboardType="email-address"
        />
        <Field
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 555 014 220"
        />
        <Field
          label="Company"
          value={companyName}
          onChangeText={setCompanyName}
          placeholder="Northwind"
        />
        <PrimaryButton
          label={createMutation.isPending ? "Saving..." : "Create contact"}
          onPress={() =>
            createMutation.mutate({
              firstName,
              lastName,
              email,
              phone,
              companyName,
            })
          }
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: theme.colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Menlo",
  },
  flex: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    color: theme.colors.ink,
    fontWeight: "700",
  },
  meta: {
    marginTop: 3,
    color: theme.colors.muted,
    fontSize: 13,
  },
});
