import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { api } from '../../services/api';
import { Agent } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type AgentsListScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function AgentsListScreen({ navigation }: AgentsListScreenProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    try {
      const data = await api.getAgents();
      setAgents(data);
    } catch (error) {
      setAgents([]);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchAgents();
    setRefreshing(false);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'paused': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderItem = ({ item }: { item: Agent }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AgentChat', { agentId: item.id, agentName: item.name })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.agentIcon}>
          <Text style={styles.agentIconText}>🤖</Text>
        </View>
        <View style={styles.agentInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.agentName}>{item.name}</Text>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          </View>
          <Text style={styles.agentDesc} numberOfLines={2}>{item.description}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerStat}>
          <Text style={styles.footerValue}>{item.runsCount.toLocaleString()}</Text>
          <Text style={styles.footerLabel}>Total Runs</Text>
        </View>
        <View style={styles.footerStat}>
          <Text style={styles.footerValue}>{item.lastRun ? new Date(item.lastRun).toLocaleDateString() : 'Never'}</Text>
          <Text style={styles.footerLabel}>Last Run</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <View style={[styles.statusDotSmall, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusPillText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={agents}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No agents configured</Text>
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
    marginBottom: 12,
  },
  agentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  agentIconText: {
    fontSize: 22,
  },
  agentInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  agentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  agentDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    gap: 16,
  },
  footerStat: {
    flex: 1,
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  footerLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
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
