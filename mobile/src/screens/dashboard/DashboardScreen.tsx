import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DashboardStats } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type DashboardScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { user, logout } = useAuth();
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (error) {
      setStats(null);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }

  const StatCard = ({ title, value, color }: { title: string; value: string | number; color: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const QuickAction = ({ title, icon, screen }: { title: string; icon: string; screen: string }) => (
    <TouchableOpacity
      style={styles.quickAction}
      onPress={() => navigation.navigate(screen)}
    >
      <Text style={styles.quickActionIcon}>{icon}</Text>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name || 'User'}!</Text>
          <Text style={styles.date}>Welcome to Nucleo One</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction title="Contacts" icon="👥" screen="CRM" />
          <QuickAction title="Leads" icon="🎯" screen="CRM" />
          <QuickAction title="Deals" icon="💰" screen="CRM" />
          <QuickAction title="Employees" icon="👨‍💼" screen="HRM" />
          <QuickAction title="Projects" icon="📁" screen="Projects" />
          <QuickAction title="Leave" icon="📅" screen="HRM" />
        </View>
      </View>

      {stats && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CRM Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard title="Contacts" value={stats.totalContacts} color="#4F46E5" />
              <StatCard title="Leads" value={stats.totalLeads} color="#F59E0B" />
              <StatCard title="Deals" value={stats.totalDeals} color="#10B981" />
              <StatCard title="Deal Value" value={`$${(stats.dealsValue / 1000).toFixed(0)}K`} color="#8B5CF6" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Operations</Text>
            <View style={styles.statsGrid}>
              <StatCard title="Projects" value={stats.totalProjects} color="#EC4899" />
              <StatCard title="Active" value={stats.activeProjects} color="#06B6D4" />
              <StatCard title="Employees" value={stats.totalEmployees} color="#84CC16" />
              <StatCard title="Leave Pending" value={stats.pendingLeaveRequests} color="#F97316" />
            </View>
          </View>
        </>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <Text style={styles.activityText}>Welcome to Nucleo One Mobile!</Text>
          <Text style={styles.activityTime}>Just now</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#4F46E5',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 14,
    color: '#E0E7FF',
    marginTop: 4,
  },
  notificationIcon: {
    fontSize: 24,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  activityText: {
    fontSize: 14,
    color: '#374151',
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  logoutButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});