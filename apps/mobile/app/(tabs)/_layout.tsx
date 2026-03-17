import { Tabs } from "expo-router";
import { Text } from "react-native";
import { theme } from "../../src/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: "#c8cfdb",
        tabBarStyle: {
          backgroundColor: theme.colors.ink,
          borderTopWidth: 0,
          height: 88,
          paddingBottom: 12,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Radar",
          tabBarAccessibilityLabel: "Radar - Dashboard",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 16, color, fontFamily: "Menlo" }}>RD</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: "People",
          tabBarAccessibilityLabel: "People - Contacts",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 16, color, fontFamily: "Menlo" }}>CT</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="pipeline"
        options={{
          title: "Pipeline",
          tabBarAccessibilityLabel: "Pipeline - Deals",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 16, color, fontFamily: "Menlo" }}>PL</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: "Pulse",
          tabBarAccessibilityLabel: "Pulse - Activities",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 16, color, fontFamily: "Menlo" }}>AC</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Setup",
          tabBarAccessibilityLabel: "Setup - Settings",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 16, color, fontFamily: "Menlo" }}>ST</Text>
          ),
        }}
      />
    </Tabs>
  );
}
