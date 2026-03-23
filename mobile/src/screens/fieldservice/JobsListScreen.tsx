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
import { FieldJob } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type JobsListScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function JobsListScreen({ navigation }: JobsListScreenProps) {
  const [jobs, setJobs] = useState<FieldJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<FieldJob[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredJobs(
        jobs.filter(
          j =>
            j.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            j.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            j.address.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredJobs(jobs);
    }
  }, [searchQuery, jobs]);

  async function fetchJobs() {
    try {
      const data = await api.getJobs();
      setJobs(data);
      setFilteredJobs(data);
    } catch (error) {
      setJobs([]);
      setFilteredJobs([]);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_route': return 'En Route';
      case 'in_progress': return 'In Progress';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const renderItem = ({ item }: { item: FieldJob }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.jobNumber}>{item.jobNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status).toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.customerName}>{item.customerName}</Text>
      <Text style={styles.address}>📍 {item.address}</Text>
      <Text style={styles.scheduledTime}>
        🕐 {new Date(item.scheduledTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </Text>
      {item.notes && <Text style={styles.notes} numberOfLines={1}>📝 {item.notes}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredJobs}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No jobs found</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    alignItems: 'center',
    marginBottom: 8,
  },
  jobNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
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
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  scheduledTime: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
  },
  notes: {
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
});
