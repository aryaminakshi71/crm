import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { api } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

type DealDetailScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { dealId: string } }, 'params'>;
};

export default function DealDetailScreen({ navigation, route }: DealDetailScreenProps) {
  const { dealId } = route.params;
  const [deal, setDeal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDeal = async () => {
      try {
        setIsLoading(true);
        const data = await api.getDeal(dealId);
        setDeal(data ?? null);
      } catch (err) {
        setError('Failed to load deal');
      } finally {
        setIsLoading(false);
      }
    };
    loadDeal();
  }, [dealId]);

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

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (error || !deal) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Deal not found.'}</Text>
      </View>
    );
  }

  const stages = ['prospecting', 'proposal', 'negotiation', 'closed_won'];
  const currentStageIndex = stages.indexOf(deal.stage);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dealName}>{deal.name}</Text>
        <Text style={styles.dealValue}>${Number(deal.value).toLocaleString()}</Text>
        <View style={[styles.stageBadge, { backgroundColor: getStageColor(deal.stage) }]}>
          <Text style={styles.stageText}>{formatStage(deal.stage)}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>Deal Stage</Text>
        <View style={styles.progressBar}>
          {stages.map((stage, index) => (
            <View key={stage} style={styles.progressStep}>
              <View
                style={[
                  styles.stepDot,
                  index <= currentStageIndex && { backgroundColor: getStageColor(deal.stage) },
                ]}
              />
              <Text style={[styles.stepLabel, index <= currentStageIndex && styles.stepLabelActive]}>
                {formatStage(stage)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deal Information</Text>
        <View style={styles.card}>
          {deal.contactName ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact</Text>
              <Text style={styles.infoValue}>{deal.contactName}</Text>
            </View>
          ) : null}
          {deal.contactEmail ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{deal.contactEmail}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Close Date</Text>
            <Text style={styles.infoValue}>{deal.closeDate || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created</Text>
            <Text style={styles.infoValue}>{deal.createdAt ?? '—'}</Text>
          </View>
        </View>
      </View>

      {deal.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.card}>
            <Text style={styles.description}>{deal.description}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>✏️</Text>
          <Text style={styles.actionText}>Edit Deal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>✓</Text>
          <Text style={styles.actionText}>Mark Won</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]}>
          <Text style={styles.actionIcon}>✕</Text>
          <Text style={styles.actionText}>Mark Lost</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    color: '#6B7280',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#4F46E5',
    padding: 24,
    alignItems: 'center',
  },
  dealName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  dealValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  stageBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
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
  actionButtonDanger: {
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
});
