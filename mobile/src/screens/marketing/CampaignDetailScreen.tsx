import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Campaign } from '../../types';

type CampaignDetailScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { campaignId: string } }, 'params'>;
};

const MOCK_CAMPAIGN: Campaign & { unsubscribes: number; subject?: string; audience?: string } = {
  id: '1',
  name: 'Q1 Product Launch',
  channel: 'Email',
  status: 'active',
  sentCount: 15420,
  openRate: 38.5,
  clickRate: 12.3,
  unsubscribes: 45,
  subject: 'Introducing Nucleo One v2.0 — Your All-in-One Platform',
  audience: 'All Subscribers (15,420)',
};

const CHANNEL_COLORS: Record<string, string> = {
  Email: '#4F46E5',
  SMS: '#10B981',
  Social: '#F59E0B',
  Ads: '#EF4444',
};

export default function CampaignDetailScreen({ navigation, route }: CampaignDetailScreenProps) {
  const { campaignId } = route.params;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'paused': return '#F59E0B';
      case 'completed': return '#6B7280';
      case 'draft': return '#4F46E5';
      default: return '#6B7280';
    }
  };

  const MetricBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricBarContainer}>
        <View style={[styles.metricBarFill, { width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}%</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerBadges}>
          <View style={[styles.channelBadge, { backgroundColor: CHANNEL_COLORS[MOCK_CAMPAIGN.channel] || '#6B7280' }]}>
            <Text style={styles.badgeText}>{MOCK_CAMPAIGN.channel}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(MOCK_CAMPAIGN.status) }]}>
            <Text style={styles.badgeText}>{MOCK_CAMPAIGN.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.campaignName}>{MOCK_CAMPAIGN.name}</Text>
        <Text style={styles.sentCount}>{MOCK_CAMPAIGN.sentCount.toLocaleString()} recipients</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{MOCK_CAMPAIGN.openRate}%</Text>
          <Text style={styles.statLabel}>Open Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#4F46E5' }]}>{MOCK_CAMPAIGN.clickRate}%</Text>
          <Text style={styles.statLabel}>Click Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#EF4444' }]}>{MOCK_CAMPAIGN.unsubscribes}</Text>
          <Text style={styles.statLabel}>Unsubscribes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
            {(MOCK_CAMPAIGN.sentCount * 0.05).toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Bounced</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.card}>
          <MetricBar label="Open Rate" value={MOCK_CAMPAIGN.openRate} max={100} color="#10B981" />
          <MetricBar label="Click Rate" value={MOCK_CAMPAIGN.clickRate} max={100} color="#4F46E5" />
          <MetricBar label="Unsubscribe Rate" value={Number(((MOCK_CAMPAIGN.unsubscribes / MOCK_CAMPAIGN.sentCount) * 100).toFixed(2))} max={5} color="#EF4444" />
          <MetricBar label="Bounce Rate" value={5.0} max={20} color="#F59E0B" />
        </View>
      </View>

      {MOCK_CAMPAIGN.subject && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Campaign Info</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Subject</Text>
              <Text style={styles.infoValue}>{MOCK_CAMPAIGN.subject}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Audience</Text>
              <Text style={styles.infoValue}>{MOCK_CAMPAIGN.audience}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}
          onPress={() => Alert.alert('Campaign Paused', 'Campaign has been paused.')}
        >
          <Text style={styles.actionBtnText}>⏸ Pause</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#4F46E5' }]}
          onPress={() => Alert.alert('Duplicated', 'Campaign duplicated as a draft.')}
        >
          <Text style={styles.actionBtnText}>⊕ Duplicate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
          onPress={() => Alert.alert('Report', 'Full report would open here.')}
        >
          <Text style={styles.actionBtnText}>📊 Report</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#4F46E5',
    padding: 20,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  channelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  campaignName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sentCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
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
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  metricLabel: {
    width: 110,
    fontSize: 13,
    color: '#374151',
  },
  metricBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricValue: {
    width: 40,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    width: 80,
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
