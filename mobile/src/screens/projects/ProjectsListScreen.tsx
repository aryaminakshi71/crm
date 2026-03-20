import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Project } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ProjectsListScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ProjectsListScreen({ navigation }: ProjectsListScreenProps) {
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'Website Redesign', description: 'Complete overhaul of company website', status: 'active', progress: 75, startDate: '2024-01-15', endDate: '2024-04-15', teamSize: 5 },
    { id: '2', name: 'Mobile App Launch', description: 'Launch iOS and Android apps', status: 'active', progress: 45, startDate: '2024-02-01', endDate: '2024-06-30', teamSize: 8 },
    { id: '3', name: 'Marketing Campaign', description: 'Q2 marketing initiative', status: 'active', progress: 30, startDate: '2024-03-01', endDate: '2024-05-31', teamSize: 4 },
    { id: '4', name: 'Infrastructure Upgrade', description: 'Cloud migration project', status: 'on_hold', progress: 60, startDate: '2024-01-01', endDate: '2024-03-31', teamSize: 6 },
    { id: '5', name: 'Data Analytics Platform', description: 'Build internal analytics dashboard', status: 'completed', progress: 100, startDate: '2023-11-01', endDate: '2024-02-28', teamSize: 4 },
    { id: '6', name: 'Security Audit', description: 'Annual security compliance check', status: 'active', progress: 90, startDate: '2024-02-15', endDate: '2024-03-20', teamSize: 3 },
  ]);
  const [refreshing, setRefreshing] = useState(false);

  const activeCount = projects.filter(p => p.status === 'active').length;

  async function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'on_hold': return '#F59E0B';
      case 'completed': return '#4F46E5';
      default: return '#6B7280';
    }
  };

  const renderItem = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
    >
      <View style={styles.projectHeader}>
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{item.name}</Text>
          <Text style={styles.projectDescription} numberOfLines={2}>{item.description}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{item.progress}%</Text>
      </View>

      <View style={styles.projectMeta}>
        <Text style={styles.metaText}>📅 {item.startDate} - {item.endDate || 'TBD'}</Text>
        <Text style={styles.metaText}>👥 {item.teamSize} members</Text>
      </View>

      <TouchableOpacity
        style={styles.viewTasksButton}
        onPress={() => navigation.navigate('ProjectTasks', { projectId: item.id })}
      >
        <Text style={styles.viewTasksText}>View Tasks</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{projects.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>{activeCount}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#4F46E5' }]}>
            {projects.filter(p => p.status === 'completed').length}
          </Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
      </View>

      <FlatList
        data={projects}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  list: {
    padding: 16,
  },
  projectCard: {
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
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectInfo: {
    flex: 1,
    marginRight: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    width: 40,
    textAlign: 'right',
  },
  projectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewTasksButton: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    alignItems: 'center',
  },
  viewTasksText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
});