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
import { Campaign } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type CampaignsListScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const CHANNEL_COLORS: Record<string, string> = {
  Email: '#4F46E5',
  SMS: '#10B981',
  Social: '#F59E0B',
  Ads: '#EF4444',
};

export default function CampaignsListScreen({ navigation }: CampaignsListScreenProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const data = await api.getCampaigns();
      setCampaigns(data);
    } catch (error) {
      setCampaigns([]);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchCampaigns();
    setRefreshing(false);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'paused': return '#F59E0B';
      case 'completed': return '#6B7280';
      case 'draft': return '#4F46E5';
      default: return '#6B7280';
    }
  };

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);

  const renderItem = ({ item }: { item: Campaign }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CampaignDetail', { campaignId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.channelTag, { backgroundColor: CHANNEL_COLORS[item.channel] || '#6B7280' }]}>
          <Text style={styles.channelText}>{item.channel}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.campaignName}>{item.name}</Text>
      {item.sentCount > 0 ? (
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{item.sentCount.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Sent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{item.openRate}%</Text>
            <Text style={styles.statLabel}>Open Rate</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: '#4F46E5' }]}>{item.clickRate}%</Text>
            <Text style={styles.statLabel}>Click Rate</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.draftNote}>Draft — not yet sent</Text>
      )}
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View style={styles.summaryBar}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryValue}>{totalCampaigns}</Text>
        <Text style={styles.summaryLabel}>Total</Text>
      </View>
      <View style={[styles.summaryItem, styles.summaryBorder]}>
        <Text style={[styles.summaryValue, { color: '#10B981' }]}>{activeCampaigns}</Text>
        <Text style={styles.summaryLabel}>Active</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryValue}>{(totalSent / 1000).toFixed(1)}k</Text>
        <Text style={styles.summaryLabel}>Total Sent</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={campaigns}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<ListHeader />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No campaigns found</Text>
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
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    marginBottom: 16,
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
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
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
    gap: 8,
    marginBottom: 8,
  },
  channelTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  channelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  campaignName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  draftNote: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
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
