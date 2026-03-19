/**
 * Platform Tab - Integrations, Agents, and Monitoring
 */

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { theme } from "../../src/lib/theme";
import { useCrmClient } from "../../src/lib/api";

type PlatformTab = "integrations" | "agents" | "monitoring";

export default function PlatformScreen() {
  const [activeTab, setActiveTab] = useState<PlatformTab>("integrations");
  const client = useCrmClient();

  const tabs: { id: PlatformTab; label: string }[] = [
    { id: "integrations", label: "Integrations" },
    { id: "agents", label: "Agents" },
    { id: "monitoring", label: "Monitoring" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Platform</Text>
        <Text style={styles.subtitle}>Manage integrations, AI agents, and monitoring</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text
              style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === "integrations" && (
          <IntegrationsSection />
        )}
        {activeTab === "agents" && (
          <AgentsSection />
        )}
        {activeTab === "monitoring" && (
          <MonitoringSection />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function IntegrationsSection() {
  const integrations = [
    { name: "CRM", status: "connected", description: "Customer relationship management" },
    { name: "Helpdesk", status: "connected", description: "Support ticket management" },
    { name: "Invoicing", status: "available", description: "Billing and payments" },
    { name: "Airtable", status: "available", description: "Database integration" },
    { name: "Linear", status: "available", description: "Project tracking" },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Integrations</Text>
      {integrations.map((integration) => (
        <View key={integration.name} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{integration.name}</Text>
            <View
              style={[
                styles.badge,
                integration.status === "connected"
                  ? styles.badgeConnected
                  : styles.badgeAvailable,
              ]}
            >
              <Text style={styles.badgeText}>
                {integration.status === "connected" ? "Connected" : "Available"}
              </Text>
            </View>
          </View>
          <Text style={styles.cardDescription}>{integration.description}</Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>
              {integration.status === "connected" ? "Configure" : "Connect"}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

function AgentsSection() {
  const agents = [
    { name: "Analytics Agent", status: "active", description: "Tracks engagement and conversion metrics" },
    { name: "Billing Agent", status: "active", description: "Monitors subscription and payment events" },
    { name: "Error Agent", status: "active", description: "Detects and alerts on platform errors" },
    { name: "Uptime Agent", status: "idle", description: "Checks service availability" },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>AI Agents</Text>
      {agents.map((agent) => (
        <View key={agent.name} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{agent.name}</Text>
            <View
              style={[
                styles.badge,
                agent.status === "active"
                  ? styles.badgeConnected
                  : styles.badgeAvailable,
              ]}
            >
              <Text style={styles.badgeText}>
                {agent.status === "active" ? "Active" : "Idle"}
              </Text>
            </View>
          </View>
          <Text style={styles.cardDescription}>{agent.description}</Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Configure</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

function MonitoringSection() {
  const metrics = [
    { name: "API Health", value: "99.9%", status: "healthy" },
    { name: "Response Time", value: "145ms", status: "healthy" },
    { name: "Error Rate", value: "0.1%", status: "healthy" },
    { name: "Active Users", value: "247", status: "healthy" },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Monitoring</Text>
      <View style={styles.grid}>
        {metrics.map((metric) => (
          <View key={metric.name} style={styles.metricCard}>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricName}>{metric.name}</Text>
            <View style={styles.metricStatus}>
              <Text style={styles.statusDot}>●</Text>
              <Text style={styles.statusText}>{metric.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.ink,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.muted,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: theme.colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.muted,
  },
  activeTabText: {
    color: theme.colors.accent,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.ink,
    marginBottom: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.ink,
  },
  cardDescription: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeConnected: {
    backgroundColor: "#dcfce7",
  },
  badgeAvailable: {
    backgroundColor: "#e0e7ff",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.ink,
  },
  button: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -theme.spacing.xs,
  },
  metricCard: {
    width: "50%",
    padding: theme.spacing.xs,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.ink,
  },
  metricName: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: 4,
  },
  metricStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    color: "#22c55e",
    fontSize: 10,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#22c55e",
    fontWeight: "500",
  },
});
