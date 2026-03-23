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

type ProjectDetailScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { projectId: string } }, 'params'>;
};

export default function ProjectDetailScreen({ navigation, route }: ProjectDetailScreenProps) {
  const { projectId } = route.params;
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        const data = await api.getProject(projectId);
        setProject(data ?? null);
      } catch (err) {
        setError('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };
    loadProject();
  }, [projectId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'on_hold': return '#F59E0B';
      case 'completed': return '#4F46E5';
      default: return '#6B7280';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Project not found.'}</Text>
      </View>
    );
  }

  const progress = project.progress ?? 0;
  const budget = project.budget ?? 0;
  const spent = project.spent ?? 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.projectName}>{project.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
          <Text style={styles.statusText}>{project.status}</Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.sectionTitle}>Progress</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}% Complete</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.card}>
          <Text style={styles.description}>{project.description ?? 'No description provided.'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Start Date</Text>
            <Text style={styles.infoValue}>{project.startDate ?? '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>End Date</Text>
            <Text style={styles.infoValue}>{project.endDate ?? 'TBD'}</Text>
          </View>
        </View>
      </View>

      {budget > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget</Text>
          <View style={styles.card}>
            <View style={styles.budgetRow}>
              <View>
                <Text style={styles.budgetLabel}>Total Budget</Text>
                <Text style={styles.budgetValue}>${budget.toLocaleString()}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.budgetLabel}>Spent</Text>
                <Text style={styles.budgetValue}>${spent.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min((spent / budget) * 100, 100)}%`, backgroundColor: '#F59E0B' }]} />
            </View>
          </View>
        </View>
      ) : null}

      {project.teamSize != null ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team</Text>
          <View style={styles.card}>
            <View style={styles.teamRow}>
              <Text style={styles.teamSize}>👥 {project.teamSize} team members</Text>
            </View>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.tasksButton}
        onPress={() => navigation.navigate('ProjectTasks', { projectId: project.id })}
      >
        <Text style={styles.tasksButtonText}>View Tasks</Text>
      </TouchableOpacity>
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
  projectName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  progressCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
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
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamSize: {
    fontSize: 14,
    color: '#374151',
  },
  tasksButton: {
    margin: 16,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  tasksButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
