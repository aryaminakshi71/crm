import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { FieldJob } from '../../types';
import { api } from '../../services/api';

type JobDetailScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { jobId: string } }, 'params'>;
};

export default function JobDetailScreen({ navigation, route }: JobDetailScreenProps) {
  const { jobId } = route.params;
  const [job, setJob] = useState<FieldJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJob();
  }, []);

  async function fetchJob() {
    try {
      const data = await api.getJob(jobId);
      setJob(data);
    } catch (error) {
      Alert.alert('Error', 'Could not load job details.');
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#4F46E5';
      case 'en_route': return '#F59E0B';
      case 'in_progress': return '#8B5CF6';
      case 'completed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  const handleStartJob = () => {
    if (!job) return;
    setJob(prev => prev ? { ...prev, status: 'in_progress' } : prev);
    Alert.alert('Job Started', 'Job status updated to In Progress.');
  };

  const handleCompleteJob = () => {
    if (!job) return;
    setJob(prev => prev ? { ...prev, status: 'completed' } : prev);
    Alert.alert('Job Completed', 'Job has been marked as completed.');
  };

  const handleRequestParts = () => {
    Alert.alert('Request Parts', 'Parts request submitted to warehouse.');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Job not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.jobNumber}>{job.jobNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
          <Text style={styles.statusText}>{job.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <Text style={styles.customerName}>{job.customerName}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job Details</Text>
        <View style={styles.card}>
          <InfoRow label="Job Number" value={job.jobNumber} />
          <InfoRow label="Scheduled" value={new Date(job.scheduledTime).toLocaleString()} />
          <InfoRow label="Status" value={job.status.replace('_', ' ')} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer & Location</Text>
        <View style={styles.card}>
          <InfoRow label="Customer" value={job.customerName} />
          <InfoRow label="Address" value={job.address} />
          <TouchableOpacity style={styles.mapButton}>
            <Text style={styles.mapButtonText}>🗺 Open in Maps</Text>
          </TouchableOpacity>
        </View>
      </View>

      {job.notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notes}>{job.notes}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documentation</Text>
        <View style={styles.docButtons}>
          <TouchableOpacity
            style={styles.docBtn}
            onPress={() => Alert.alert('Photo', 'Camera would open here.')}
          >
            <Text style={styles.docBtnIcon}>📷</Text>
            <Text style={styles.docBtnText}>Add Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.docBtn}
            onPress={() => Alert.alert('Signature', 'Signature pad would open here.')}
          >
            <Text style={styles.docBtnIcon}>✍️</Text>
            <Text style={styles.docBtnText}>Get Signature</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]}
          onPress={handleStartJob}
        >
          <Text style={styles.actionBtnText}>▶ Start Job</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
          onPress={handleCompleteJob}
        >
          <Text style={styles.actionBtnText}>✓ Complete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}
          onPress={handleRequestParts}
        >
          <Text style={styles.actionBtnText}>🔧 Parts</Text>
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
  loadingContainer: {
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
  jobNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  customerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    padding: 16,
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
    flex: 1,
    textAlign: 'right',
  },
  mapButton: {
    marginTop: 12,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapButtonText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  notes: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  docButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  docBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  docBtnIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  docBtnText: {
    fontSize: 12,
    color: '#374151',
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
