import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { api } from '../../services/api';
import { Expense } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ExpensesListScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const MOCK_EXPENSES: Expense[] = [
  { id: '1', description: 'Team lunch - Q1 kickoff', amount: 245.50, category: 'Meals', date: '2026-03-20', status: 'approved' },
  { id: '2', description: 'AWS cloud services', amount: 1820.00, category: 'Software', date: '2026-03-19', status: 'approved' },
  { id: '3', description: 'Conference travel - San Francisco', amount: 780.00, category: 'Travel', date: '2026-03-18', status: 'pending' },
  { id: '4', description: 'Office supplies', amount: 92.30, category: 'Office', date: '2026-03-17', status: 'pending' },
  { id: '5', description: 'Client dinner - Acme Corp', amount: 310.00, category: 'Meals', date: '2026-03-15', status: 'approved' },
  { id: '6', description: 'Training course - React Native', amount: 499.00, category: 'Education', date: '2026-03-10', status: 'rejected' },
  { id: '7', description: 'Hotel - Chicago Summit', amount: 420.00, category: 'Travel', date: '2026-03-05', status: 'pending' },
  { id: '8', description: 'Figma license renewal', amount: 144.00, category: 'Software', date: '2026-03-01', status: 'approved' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Meals: '#F59E0B',
  Software: '#4F46E5',
  Travel: '#10B981',
  Office: '#6B7280',
  Education: '#8B5CF6',
};

export default function ExpensesListScreen({ navigation }: ExpensesListScreenProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    try {
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (error) {
      setExpenses(MOCK_EXPENSES);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalApproved = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
  const totalPending = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);

  const renderItem = ({ item }: { item: Expense }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[item.category] || '#6B7280' }]} />
        <View style={styles.cardLeft}>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.meta}>{item.category} · {item.date}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const ListHeader = () => (
    <View style={styles.summaryBar}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Total</Text>
        <Text style={styles.summaryValue}>${totalAmount.toFixed(2)}</Text>
      </View>
      <View style={[styles.summaryItem, styles.summaryBorder]}>
        <Text style={styles.summaryLabel}>Approved</Text>
        <Text style={[styles.summaryValue, { color: '#10B981' }]}>${totalApproved.toFixed(2)}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Pending</Text>
        <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>${totalPending.toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<ListHeader />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No expenses found</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => Alert.alert('Submit Expense', 'Expense submission form would open here.')}
      >
        <Text style={styles.fabText}>+ Submit Expense</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  summaryItem: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  summaryBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  list: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  cardLeft: {
    flex: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  description: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: '#6B7280',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
