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
import { Invoice } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type InvoicesListScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const MOCK_INVOICES: Invoice[] = [
  { id: '1', number: 'INV-2026-001', clientName: 'Acme Corporation', amount: 12500.00, status: 'paid', dueDate: '2026-03-15', createdAt: '2026-02-15' },
  { id: '2', number: 'INV-2026-002', clientName: 'TechStart Inc', amount: 4200.00, status: 'sent', dueDate: '2026-04-01', createdAt: '2026-03-01' },
  { id: '3', number: 'INV-2026-003', clientName: 'Global Ventures', amount: 8750.50, status: 'overdue', dueDate: '2026-03-10', createdAt: '2026-02-10' },
  { id: '4', number: 'INV-2026-004', clientName: 'Blue Ocean Ltd', amount: 3300.00, status: 'draft', dueDate: '2026-04-15', createdAt: '2026-03-20' },
  { id: '5', number: 'INV-2026-005', clientName: 'Pinnacle Group', amount: 22000.00, status: 'paid', dueDate: '2026-03-01', createdAt: '2026-02-01' },
  { id: '6', number: 'INV-2026-006', clientName: 'Sunrise Media', amount: 1650.75, status: 'sent', dueDate: '2026-04-10', createdAt: '2026-03-10' },
];

const STATUS_TABS = ['all', 'draft', 'sent', 'paid', 'overdue'] as const;

export default function InvoicesListScreen({ navigation }: InvoicesListScreenProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    let result = invoices;
    if (activeTab !== 'all') {
      result = result.filter(i => i.status === activeTab);
    }
    if (searchQuery) {
      result = result.filter(
        i =>
          i.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredInvoices(result);
  }, [searchQuery, invoices, activeTab]);

  async function fetchInvoices() {
    try {
      const data = await api.getInvoices();
      setInvoices(data);
      setFilteredInvoices(data);
    } catch (error) {
      setInvoices(MOCK_INVOICES);
      setFilteredInvoices(MOCK_INVOICES);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchInvoices();
    setRefreshing(false);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'sent': return '#4F46E5';
      case 'overdue': return '#EF4444';
      case 'draft': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const renderItem = ({ item }: { item: Invoice }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
    >
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <Text style={styles.invoiceNumber}>{item.number}</Text>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <Text style={styles.dueDate}>Due: {item.dueDate}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.amount}>${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search invoices..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.tabsRow}>
        {STATUS_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredInvoices}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No invoices found</Text>
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
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
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
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 2,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  dueDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
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
});
