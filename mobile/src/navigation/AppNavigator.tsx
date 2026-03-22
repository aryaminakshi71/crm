import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';

// CRM Screens
import ContactsListScreen from '../screens/crm/ContactsListScreen';
import ContactDetailScreen from '../screens/crm/ContactDetailScreen';
import LeadsListScreen from '../screens/crm/LeadsListScreen';
import LeadDetailScreen from '../screens/crm/LeadDetailScreen';
import DealsListScreen from '../screens/crm/DealsListScreen';
import DealDetailScreen from '../screens/crm/DealDetailScreen';

// HRM Screens
import EmployeesListScreen from '../screens/hrm/EmployeesListScreen';
import EmployeeDetailScreen from '../screens/hrm/EmployeeDetailScreen';
import LeaveRequestsScreen from '../screens/hrm/LeaveRequestsScreen';

// Projects Screens
import ProjectsListScreen from '../screens/projects/ProjectsListScreen';
import ProjectDetailScreen from '../screens/projects/ProjectDetailScreen';
import ProjectTasksScreen from '../screens/projects/ProjectTasksScreen';

// Helpdesk Screens
import TicketsListScreen from '../screens/helpdesk/TicketsListScreen';
import TicketDetailScreen from '../screens/helpdesk/TicketDetailScreen';

// Finance Screens
import InvoicesListScreen from '../screens/finance/InvoicesListScreen';
import InvoiceDetailScreen from '../screens/finance/InvoiceDetailScreen';
import ExpensesListScreen from '../screens/finance/ExpensesListScreen';

// Field Service Screens
import JobsListScreen from '../screens/fieldservice/JobsListScreen';
import JobDetailScreen from '../screens/fieldservice/JobDetailScreen';

// Marketing Screens
import CampaignsListScreen from '../screens/marketing/CampaignsListScreen';
import CampaignDetailScreen from '../screens/marketing/CampaignDetailScreen';

// Inventory Screens
import ProductsListScreen from '../screens/inventory/ProductsListScreen';
import ProductDetailScreen from '../screens/inventory/ProductDetailScreen';

// AI Agents Screens
import AgentsListScreen from '../screens/agents/AgentsListScreen';
import AgentChatScreen from '../screens/agents/AgentChatScreen';

// Communications Screens
import InboxScreen from '../screens/communications/InboxScreen';
import ConversationScreen from '../screens/communications/ConversationScreen';

// Social Screens
import PostsCalendarScreen from '../screens/social/PostsCalendarScreen';

// Settings & Notifications
import SettingsScreen from '../screens/settings/SettingsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

// ─── Type definitions ────────────────────────────────────────────────────────

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
};

export type CRMStackParamList = {
  ContactsList: undefined;
  ContactDetail: { contactId: string };
  LeadsList: undefined;
  LeadDetail: { leadId: string };
  DealsList: undefined;
  DealDetail: { dealId: string };
};

export type HRMStackParamList = {
  EmployeesList: undefined;
  EmployeeDetail: { employeeId: string };
  LeaveRequests: undefined;
};

export type ProjectsStackParamList = {
  ProjectsList: undefined;
  ProjectDetail: { projectId: string };
  ProjectTasks: { projectId: string };
};

export type HelpdeskStackParamList = {
  TicketsList: undefined;
  TicketDetail: { ticketId: string };
};

export type FinanceStackParamList = {
  InvoicesList: undefined;
  InvoiceDetail: { invoiceId: string };
  ExpensesList: undefined;
};

export type FieldServiceStackParamList = {
  JobsList: undefined;
  JobDetail: { jobId: string };
};

export type MarketingStackParamList = {
  CampaignsList: undefined;
  CampaignDetail: { campaignId: string };
};

export type InventoryStackParamList = {
  ProductsList: undefined;
  ProductDetail: { productId: string };
};

export type AgentsStackParamList = {
  AgentsList: undefined;
  AgentChat: { agentId: string; agentName: string };
};

export type CommunicationsStackParamList = {
  Inbox: undefined;
  Conversation: { conversationId: string; contactName: string };
};

export type SocialStackParamList = {
  PostsCalendar: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  CRM: undefined;
  HRM: undefined;
  Projects: undefined;
  Helpdesk: undefined;
  Finance: undefined;
  More: undefined;
};

// ─── Stack navigators ────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator();
const CRMStack = createNativeStackNavigator();
const HRMStack = createNativeStackNavigator();
const ProjectsStack = createNativeStackNavigator();
const HelpdeskStack = createNativeStackNavigator();
const FinanceStack = createNativeStackNavigator();
const FieldServiceStack = createNativeStackNavigator();
const MarketingStack = createNativeStackNavigator();
const InventoryStack = createNativeStackNavigator();
const AgentsStack = createNativeStackNavigator();
const CommunicationsStack = createNativeStackNavigator();
const SocialStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HEADER_OPTS = {
  headerStyle: { backgroundColor: '#4F46E5' },
  headerTintColor: '#fff',
};

// ─── Tab icon ────────────────────────────────────────────────────────────────

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '🏠',
    CRM: '👥',
    HRM: '👨‍💼',
    Projects: '📁',
    Helpdesk: '🎧',
    Finance: '💰',
    More: '⋯',
  };
  return (
    <View style={styles.tabIcon}>
      <Text style={{ fontSize: focused ? 22 : 20 }}>{icons[name] || '•'}</Text>
    </View>
  );
}

// ─── More Screen ─────────────────────────────────────────────────────────────

type MoreModule = {
  label: string;
  icon: string;
  screen: string;
  description: string;
};

const MORE_MODULES: MoreModule[] = [
  { label: 'Field Service', icon: '🔧', screen: 'FieldService', description: 'Jobs, dispatching & field ops' },
  { label: 'Marketing', icon: '📢', screen: 'Marketing', description: 'Campaigns & automation' },
  { label: 'Inventory', icon: '📦', screen: 'Inventory', description: 'Products, stock & warehousing' },
  { label: 'AI Agents', icon: '🤖', screen: 'Agents', description: 'Automated AI workflows' },
  { label: 'Communications', icon: '📱', screen: 'Communications', description: 'SMS, voice & chat inbox' },
  { label: 'Social Media', icon: '📲', screen: 'Social', description: 'Scheduled posts & analytics' },
];

function MoreScreenComponent({ navigation }: { navigation: any }) {
  return (
    <ScrollView style={moreStyles.container} contentContainerStyle={moreStyles.content}>
      <Text style={moreStyles.heading}>More Modules</Text>
      {MORE_MODULES.map(mod => (
        <TouchableOpacity
          key={mod.screen}
          style={moreStyles.row}
          onPress={() => navigation.navigate(mod.screen)}
        >
          <View style={moreStyles.iconBox}>
            <Text style={moreStyles.icon}>{mod.icon}</Text>
          </View>
          <View style={moreStyles.rowText}>
            <Text style={moreStyles.rowLabel}>{mod.label}</Text>
            <Text style={moreStyles.rowDesc}>{mod.description}</Text>
          </View>
          <Text style={moreStyles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const moreStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  heading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  rowDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  chevron: {
    fontSize: 22,
    color: '#9CA3AF',
    marginLeft: 8,
  },
});

// ─── Individual stacks ────────────────────────────────────────────────────────

function CRMStackScreen() {
  return (
    <CRMStack.Navigator screenOptions={HEADER_OPTS}>
      <CRMStack.Screen name="ContactsList" component={ContactsListScreen as any} options={{ title: 'Contacts' }} />
      <CRMStack.Screen name="ContactDetail" component={ContactDetailScreen as any} options={{ title: 'Contact Details' }} />
      <CRMStack.Screen name="LeadsList" component={LeadsListScreen as any} options={{ title: 'Leads' }} />
      <CRMStack.Screen name="LeadDetail" component={LeadDetailScreen as any} options={{ title: 'Lead Details' }} />
      <CRMStack.Screen name="DealsList" component={DealsListScreen as any} options={{ title: 'Deals' }} />
      <CRMStack.Screen name="DealDetail" component={DealDetailScreen as any} options={{ title: 'Deal Details' }} />
    </CRMStack.Navigator>
  );
}

function HRMStackScreen() {
  return (
    <HRMStack.Navigator screenOptions={HEADER_OPTS}>
      <HRMStack.Screen name="EmployeesList" component={EmployeesListScreen as any} options={{ title: 'Employees' }} />
      <HRMStack.Screen name="EmployeeDetail" component={EmployeeDetailScreen as any} options={{ title: 'Employee Details' }} />
      <HRMStack.Screen name="LeaveRequests" component={LeaveRequestsScreen as any} options={{ title: 'Leave Requests' }} />
    </HRMStack.Navigator>
  );
}

function ProjectsStackScreen() {
  return (
    <ProjectsStack.Navigator screenOptions={HEADER_OPTS}>
      <ProjectsStack.Screen name="ProjectsList" component={ProjectsListScreen as any} options={{ title: 'Projects' }} />
      <ProjectsStack.Screen name="ProjectDetail" component={ProjectDetailScreen as any} options={{ title: 'Project Details' }} />
      <ProjectsStack.Screen name="ProjectTasks" component={ProjectTasksScreen as any} options={{ title: 'Tasks' }} />
    </ProjectsStack.Navigator>
  );
}

function HelpdeskStackScreen() {
  return (
    <HelpdeskStack.Navigator screenOptions={HEADER_OPTS}>
      <HelpdeskStack.Screen name="TicketsList" component={TicketsListScreen as any} options={{ title: 'Helpdesk' }} />
      <HelpdeskStack.Screen name="TicketDetail" component={TicketDetailScreen as any} options={{ title: 'Ticket Details' }} />
    </HelpdeskStack.Navigator>
  );
}

function FinanceStackScreen() {
  return (
    <FinanceStack.Navigator screenOptions={HEADER_OPTS}>
      <FinanceStack.Screen name="InvoicesList" component={InvoicesListScreen as any} options={{ title: 'Invoices' }} />
      <FinanceStack.Screen name="InvoiceDetail" component={InvoiceDetailScreen as any} options={{ title: 'Invoice Details' }} />
      <FinanceStack.Screen name="ExpensesList" component={ExpensesListScreen as any} options={{ title: 'Expenses' }} />
    </FinanceStack.Navigator>
  );
}

function FieldServiceStackScreen() {
  return (
    <FieldServiceStack.Navigator screenOptions={HEADER_OPTS}>
      <FieldServiceStack.Screen name="JobsList" component={JobsListScreen as any} options={{ title: 'Field Service' }} />
      <FieldServiceStack.Screen name="JobDetail" component={JobDetailScreen as any} options={{ title: 'Job Details' }} />
    </FieldServiceStack.Navigator>
  );
}

function MarketingStackScreen() {
  return (
    <MarketingStack.Navigator screenOptions={HEADER_OPTS}>
      <MarketingStack.Screen name="CampaignsList" component={CampaignsListScreen as any} options={{ title: 'Marketing' }} />
      <MarketingStack.Screen name="CampaignDetail" component={CampaignDetailScreen as any} options={{ title: 'Campaign Details' }} />
    </MarketingStack.Navigator>
  );
}

function InventoryStackScreen() {
  return (
    <InventoryStack.Navigator screenOptions={HEADER_OPTS}>
      <InventoryStack.Screen name="ProductsList" component={ProductsListScreen as any} options={{ title: 'Inventory' }} />
      <InventoryStack.Screen name="ProductDetail" component={ProductDetailScreen as any} options={{ title: 'Product Details' }} />
    </InventoryStack.Navigator>
  );
}

function AgentsStackScreen() {
  return (
    <AgentsStack.Navigator screenOptions={HEADER_OPTS}>
      <AgentsStack.Screen name="AgentsList" component={AgentsListScreen as any} options={{ title: 'AI Agents' }} />
      <AgentsStack.Screen name="AgentChat" component={AgentChatScreen as any} options={{ title: 'Agent Chat' }} />
    </AgentsStack.Navigator>
  );
}

function CommunicationsStackScreen() {
  return (
    <CommunicationsStack.Navigator screenOptions={HEADER_OPTS}>
      <CommunicationsStack.Screen name="Inbox" component={InboxScreen as any} options={{ title: 'Communications' }} />
      <CommunicationsStack.Screen name="Conversation" component={ConversationScreen as any} options={{ title: 'Conversation' }} />
    </CommunicationsStack.Navigator>
  );
}

function SocialStackScreen() {
  return (
    <SocialStack.Navigator screenOptions={HEADER_OPTS}>
      <SocialStack.Screen name="PostsCalendar" component={PostsCalendarScreen as any} options={{ title: 'Social Media' }} />
    </SocialStack.Navigator>
  );
}

function MoreStackScreen() {
  return (
    <MoreStack.Navigator screenOptions={HEADER_OPTS}>
      <MoreStack.Screen name="MoreHome" component={MoreScreenComponent as any} options={{ title: 'More' }} />
      <MoreStack.Screen name="FieldService" component={FieldServiceStackScreen as any} options={{ headerShown: false }} />
      <MoreStack.Screen name="Marketing" component={MarketingStackScreen as any} options={{ headerShown: false }} />
      <MoreStack.Screen name="Inventory" component={InventoryStackScreen as any} options={{ headerShown: false }} />
      <MoreStack.Screen name="Agents" component={AgentsStackScreen as any} options={{ headerShown: false }} />
      <MoreStack.Screen name="Communications" component={CommunicationsStackScreen as any} options={{ headerShown: false }} />
      <MoreStack.Screen name="Social" component={SocialStackScreen as any} options={{ headerShown: false }} />
    </MoreStack.Navigator>
  );
}

// ─── Main Tab Navigator ───────────────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#6B7280',
        headerStyle: { backgroundColor: '#4F46E5' },
        headerTintColor: '#fff',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="CRM" component={CRMStackScreen} options={{ headerShown: false, title: 'CRM' }} />
      <Tab.Screen name="HRM" component={HRMStackScreen} options={{ headerShown: false, title: 'HRM' }} />
      <Tab.Screen name="Projects" component={ProjectsStackScreen} options={{ headerShown: false, title: 'Projects' }} />
      <Tab.Screen name="Helpdesk" component={HelpdeskStackScreen} options={{ headerShown: false, title: 'Helpdesk' }} />
      <Tab.Screen name="Finance" component={FinanceStackScreen} options={{ headerShown: false, title: 'Finance' }} />
      <Tab.Screen name="More" component={MoreStackScreen} options={{ headerShown: false, title: 'More' }} />
    </Tab.Navigator>
  );
}

// ─── Auth Stack ───────────────────────────────────────────────────────────────

function AuthStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStackScreen />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
});
