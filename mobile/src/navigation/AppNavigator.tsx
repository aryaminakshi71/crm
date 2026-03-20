import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

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

// Settings & Notifications
import SettingsScreen from '../screens/settings/SettingsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

// Type definitions
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

export type MainTabParamList = {
  Dashboard: undefined;
  CRM: undefined;
  HRM: undefined;
  Projects: undefined;
  Settings: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator();
const CRMStack = createNativeStackNavigator();
const HRMStack = createNativeStackNavigator();
const ProjectsStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Icons
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '🏠',
    CRM: '👥',
    HRM: '👨‍💼',
    Projects: '📁',
    Settings: '⚙️',
  };
  return (
    <View style={styles.tabIcon}>
      <Text style={{ fontSize: 20 }}>{icons[name] || '•'}</Text>
    </View>
  );
}

// CRM Stack
function CRMStackScreen() {
  return (
    <CRMStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4F46E5' },
        headerTintColor: '#fff',
      }}
    >
      <CRMStack.Screen name="ContactsList" component={ContactsListScreen as any} options={{ title: 'Contacts' }} />
      <CRMStack.Screen name="ContactDetail" component={ContactDetailScreen as any} options={{ title: 'Contact Details' }} />
      <CRMStack.Screen name="LeadsList" component={LeadsListScreen as any} options={{ title: 'Leads' }} />
      <CRMStack.Screen name="LeadDetail" component={LeadDetailScreen as any} options={{ title: 'Lead Details' }} />
      <CRMStack.Screen name="DealsList" component={DealsListScreen as any} options={{ title: 'Deals' }} />
      <CRMStack.Screen name="DealDetail" component={DealDetailScreen as any} options={{ title: 'Deal Details' }} />
    </CRMStack.Navigator>
  );
}

// HRM Stack
function HRMStackScreen() {
  return (
    <HRMStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4F46E5' },
        headerTintColor: '#fff',
      }}
    >
      <HRMStack.Screen name="EmployeesList" component={EmployeesListScreen as any} options={{ title: 'Employees' }} />
      <HRMStack.Screen name="EmployeeDetail" component={EmployeeDetailScreen as any} options={{ title: 'Employee Details' }} />
      <HRMStack.Screen name="LeaveRequests" component={LeaveRequestsScreen as any} options={{ title: 'Leave Requests' }} />
    </HRMStack.Navigator>
  );
}

// Projects Stack
function ProjectsStackScreen() {
  return (
    <ProjectsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4F46E5' },
        headerTintColor: '#fff',
      }}
    >
      <ProjectsStack.Screen name="ProjectsList" component={ProjectsListScreen as any} options={{ title: 'Projects' }} />
      <ProjectsStack.Screen name="ProjectDetail" component={ProjectDetailScreen as any} options={{ title: 'Project Details' }} />
      <ProjectsStack.Screen name="ProjectTasks" component={ProjectTasksScreen as any} options={{ title: 'Tasks' }} />
    </ProjectsStack.Navigator>
  );
}

// Main Tab Navigator
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
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

// Auth Stack
function AuthStackScreen() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Root Navigator
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