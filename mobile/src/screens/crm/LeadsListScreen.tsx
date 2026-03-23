import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { api } from '../../services/api';
import { Lead } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type LeadsListScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LeadsListScreen({ navigation }: LeadsListScreenProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getLeads();
      setLeads(data ?? []);
    } catch (err) {
      setError('Failed to load leads');
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLeads = searchQuery
    ? leads.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.company?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : leads;

  async function onRefresh() {
    setRefreshing(true);
    try {
      const data = await api.getLeads();
      setLeads(data ?? []);
      setError(null);
    } catch (err) {
      setError('Failed to load leads');
    } finally {
      setRefreshing(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#3B82F6';
      case 'contacted': return '#F59E0B';
      case 'qualified': return '#8B5CF6';
      case 'converted': return '#10B981';
      case 'lost': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return `$${(value / 1000).toFixed(0)}K`;
  };

  const renderItem = ({ item }: { item: Lead }) => (
    <TouchableOpacity
      style={styles.leadCard}
      onPress={() => navigation.navigate('LeadDetail', { leadId: item.id })}
    >
      <View style={styles.leadHeader}>
        <View>
          <Text style={styles.leadName}>{item.name}</Text>
          <Text style={styles.leadCompany}>{item.company}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.leadDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Value</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.value)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Source</Text>
          <Text style={styles.detailValue}>{item.source || '-'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Created</Text>
          <Text style={styles.detailValue}>{item.createdAt}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search leads..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredLeads}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{error ?? 'No leads found'}</Text>
          </View>
        }
      />

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]} onPress={() => navigation.navigate('ContactsList')}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => {}}>
          <Text style={styles.tabText}>Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, styles.tabActive]} onPress={() => navigation.navigate('DealsList')}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Deals</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  list: {
    padding: 16,
  },
  leadCard: {
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
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  leadCompany: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  leadDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginTop: 2,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
});
