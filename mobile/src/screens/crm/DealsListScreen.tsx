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
import { Deal } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type DealsListScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function DealsListScreen({ navigation }: DealsListScreenProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getDeals();
      setDeals(data ?? []);
    } catch (err) {
      setError('Failed to load deals');
      setDeals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDeals = searchQuery
    ? deals.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.contactName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : deals;

  const totalValue = deals.filter(d => d.stage !== 'closed_lost').reduce((sum, d) => sum + d.value, 0);
  const wonValue = deals.filter(d => d.stage === 'closed_won').reduce((sum, d) => sum + d.value, 0);

  async function onRefresh() {
    setRefreshing(true);
    try {
      const data = await api.getDeals();
      setDeals(data ?? []);
      setError(null);
    } catch (err) {
      setError('Failed to load deals');
    } finally {
      setRefreshing(false);
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospecting': return '#3B82F6';
      case 'proposal': return '#F59E0B';
      case 'negotiation': return '#8B5CF6';
      case 'closed_won': return '#10B981';
      case 'closed_lost': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatStage = (stage: string) => stage.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

  const formatCurrency = (value: number) => `$${(value / 1000).toFixed(0)}K`;

  const renderItem = ({ item }: { item: Deal }) => (
    <TouchableOpacity
      style={styles.dealCard}
      onPress={() => navigation.navigate('DealDetail', { dealId: item.id })}
    >
      <View style={styles.dealHeader}>
        <View>
          <Text style={styles.dealName}>{item.name}</Text>
          {item.contactName && <Text style={styles.dealContact}>{item.contactName}</Text>}
        </View>
        <Text style={styles.dealValue}>{formatCurrency(item.value)}</Text>
      </View>
      <View style={styles.dealFooter}>
        <View style={[styles.stageBadge, { backgroundColor: getStageColor(item.stage) }]}>
          <Text style={styles.stageText}>{formatStage(item.stage)}</Text>
        </View>
        {item.closeDate && <Text style={styles.closeDate}>Close: {item.closeDate}</Text>}
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
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Pipeline</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalValue)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Won</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>{formatCurrency(wonValue)}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search deals..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredDeals}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{error ?? 'No deals found'}</Text>
          </View>
        }
      />

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]} onPress={() => navigation.navigate('ContactsList')}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, styles.tabActive]} onPress={() => navigation.navigate('LeadsList')}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => {}}>
          <Text style={styles.tabText}>Deals</Text>
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
  summary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
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
  dealCard: {
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
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dealContact: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  dealValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  dealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  stageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stageText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  closeDate: {
    fontSize: 12,
    color: '#9CA3AF',
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
