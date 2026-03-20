import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Notification } from '../../types';
import { api } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NotificationsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'New Lead Assigned', message: 'You have been assigned a new lead: Tech Startup Inc', type: 'info', read: false, createdAt: '2024-03-20 10:30' },
    { id: '2', title: 'Deal Status Updated', message: 'Enterprise License deal moved to Negotiation stage', type: 'success', read: false, createdAt: '2024-03-20 09:15' },
    { id: '3', title: 'Leave Request Pending', message: 'James Wilson has requested leave for March 18-19', type: 'warning', read: true, createdAt: '2024-03-19 14:00' },
    { id: '4', title: 'Project Milestone', message: 'Website Redesign project is 75% complete', type: 'info', read: true, createdAt: '2024-03-19 11:30' },
    { id: '5', title: 'Task Overdue', message: 'Unit tests task is overdue', type: 'error', read: true, createdAt: '2024-03-18 16:45' },
    { id: '6', title: 'New Employee Joined', message: 'Anna Taylor has joined the Design team', type: 'success', read: true, createdAt: '2024-03-17 09:00' },
    { id: '7', title: 'Meeting Reminder', message: 'Team standup in 30 minutes', type: 'info', read: true, createdAt: '2024-03-16 08:30' },
  ]);
  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  async function onRefresh() {
    setRefreshing(true);
    try {
      const data = await api.getNotifications();
      if (data.length > 0) {
        setNotifications(data);
      }
    } catch (error) {
      // Keep mock data
    }
    setRefreshing(false);
  }

  async function markAsRead(id: string) {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    try {
      await api.markNotificationRead(id);
    } catch (error) {
      // Ignore error
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return '#3B82F6';
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📢';
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={[styles.iconContainer, { backgroundColor: getTypeColor(item.type) }]}>
        <Text style={styles.icon}>{getTypeIcon(item.type)}</Text>
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.title, !item.read && styles.unreadTitle]}>{item.title}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{item.createdAt}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount} unread</Text>
        </View>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
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
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  unreadTitle: {
    color: '#4F46E5',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  empty: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
});