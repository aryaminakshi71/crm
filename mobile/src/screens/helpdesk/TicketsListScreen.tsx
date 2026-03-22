import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { api } from '../../services/api';
import { Ticket } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type TicketsListScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const MOCK_TICKETS: Ticket[] = [
  { id: '1', title: 'Cannot login to dashboard', description: 'User reports 403 error on login', status: 'open', priority: 'urgent', assignee: 'Sarah Chen', slaMinutes: 45, createdAt: '2026-03-22T08:00:00Z' },
  { id: '2', title: 'Invoice PDF not generating', description: 'PDF export fails for invoices over $10k', status: 'in_progress', priority: 'high', assignee: 'Mike Torres', slaMinutes: 120, createdAt: '2026-03-21T14:30:00Z' },
  { id: '3', title: 'Slow page load on reports', description: 'Reports page takes >10s to load', status: 'in_progress', priority: 'medium', assignee: 'Sarah Chen', slaMinutes: 240, createdAt: '2026-03-21T10:00:00Z' },
  { id: '4', title: 'Email notifications not sent', description: 'Welcome emails not delivering', status: 'open', priority: 'high', assignee: undefined, slaMinutes: 90, createdAt: '2026-03-22T06:15:00Z' },
  { id: '5', title: 'Data export format wrong', description: 'CSV missing header row', status: 'resolved', priority: 'low', assignee: 'James Park', slaMinutes: 480, createdAt: '2026-03-20T09:00:00Z' },
  { id: '6', title: 'Mobile app crashes on Android', description: 'Crash on startup for Android 12', status: 'open', priority: 'urgent', assignee: 'Mike Torres', slaMinutes: 30, createdAt: '2026-03-22T09:45:00Z' },
  { id: '7', title: 'Calendar sync broken', description: 'Google Calendar integration not syncing', status: 'closed', priority: 'medium', assignee: 'James Park', slaMinutes: 0, createdAt: '2026-03-19T11:00:00Z' },
  { id: '8', title: 'Wrong currency displayed', description: 'USD shown instead of EUR for EU accounts', status: 'in_progress', priority: 'high', assignee: 'Sarah Chen', slaMinutes: 180, createdAt: '2026-03-22T07:30:00Z' },
];

const STATUS_FILTERS = ['all', 'open', 'in_progress', 'resolved', 'closed'] as const;

export default function TicketsListScreen({ navigation }: TicketsListScreenProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    let result = tickets;
    if (activeFilter !== 'all') {
      result = result.filter(t => t.status === activeFilter);
    }
    if (searchQuery) {
      result = result.filter(
        t =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.assignee?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredTickets(result);
  }, [searchQuery, tickets, activeFilter]);

  async function fetchTickets() {
    try {
      const data = await api.getTickets();
      setTickets(data);
      setFilteredTickets(data);
    } catch (error) {
      setTickets(MOCK_TICKETS);
      setFilteredTickets(MOCK_TICKETS);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#4F46E5';
      case 'in_progress': return '#F59E0B';
      case 'resolved': return '#10B981';
      case 'closed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#4F46E5';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const renderItem = ({ item }: { item: Ticket }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.badgeText}>{item.priority.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
        {item.assignee && (
          <Text style={styles.assignee}>👤 {item.assignee}</Text>
        )}
      </View>
      {item.slaMinutes !== undefined && item.slaMinutes > 0 && item.status !== 'resolved' && item.status !== 'closed' && (
        <View style={styles.slaRow}>
          <Text style={[styles.slaText, { color: item.slaMinutes < 60 ? '#EF4444' : '#F59E0B' }]}>
            ⏱ SLA: {item.slaMinutes >= 60 ? `${Math.floor(item.slaMinutes / 60)}h ${item.slaMinutes % 60}m` : `${item.slaMinutes}m`} remaining
          </Text>
        </View>
      )}
      <Text style={styles.createdAt}>Created {new Date(item.createdAt).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tickets..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTickets}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tickets found</Text>
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: '#4F46E5',
  },
  filterChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  assignee: {
    fontSize: 12,
    color: '#6B7280',
  },
  slaRow: {
    marginBottom: 4,
  },
  slaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  createdAt: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
});
