import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Task } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

type ProjectTasksScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { projectId: string } }, 'params'>;
};

export default function ProjectTasksScreen({ navigation, route }: ProjectTasksScreenProps) {
  const { projectId } = route.params;

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', projectId: projectId, title: 'Design homepage mockup', description: 'Create new homepage design', status: 'done', priority: 'high', assignee: 'Sarah J.', dueDate: '2024-03-01' },
    { id: '2', projectId: projectId, title: 'Implement user authentication', description: 'Set up login/signup flow', status: 'in_progress', priority: 'high', assignee: 'Mike C.', dueDate: '2024-03-10' },
    { id: '3', projectId: projectId, title: 'Create database schema', description: 'Design and implement DB', status: 'done', priority: 'medium', assignee: 'David M.', dueDate: '2024-02-28' },
    { id: '4', projectId: projectId, title: 'Build API endpoints', description: 'Create REST API', status: 'in_progress', priority: 'high', assignee: 'Emily D.', dueDate: '2024-03-15' },
    { id: '5', projectId: projectId, title: 'Write unit tests', description: 'Test coverage for core features', status: 'todo', priority: 'medium', assignee: 'James W.', dueDate: '2024-03-20' },
    { id: '6', projectId: projectId, title: 'Deploy to staging', description: 'Set up CI/CD pipeline', status: 'todo', priority: 'low', assignee: 'David M.', dueDate: '2024-03-25' },
    { id: '7', projectId: projectId, title: 'User acceptance testing', description: 'QA and bug fixes', status: 'todo', priority: 'high', assignee: 'Lisa B.', dueDate: '2024-04-01' },
  ]);

  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  async function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return '✓';
      case 'in_progress': return '⟳';
      case 'todo': return '○';
      default: return '○';
    }
  };

  const renderItem = ({ item }: { item: Task }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={styles.taskStatus}>
          <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
          <Text style={[styles.taskTitle, item.status === 'done' && styles.taskTitleDone]}>
            {item.title}
          </Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority}</Text>
        </View>
      </View>
      {item.description && (
        <Text style={styles.taskDescription}>{item.description}</Text>
      )}
      <View style={styles.taskMeta}>
        {item.assignee && <Text style={styles.metaText}>👤 {item.assignee}</Text>}
        {item.dueDate && <Text style={styles.metaText}>📅 {item.dueDate}</Text>}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All ({tasks.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'todo' && styles.filterButtonActive]}
          onPress={() => setFilter('todo')}
        >
          <Text style={[styles.filterText, filter === 'todo' && styles.filterTextActive]}>To Do ({todoCount})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'in_progress' && styles.filterButtonActive]}
          onPress={() => setFilter('in_progress')}
        >
          <Text style={[styles.filterText, filter === 'in_progress' && styles.filterTextActive]}>In Progress ({inProgressCount})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'done' && styles.filterButtonActive]}
          onPress={() => setFilter('done')}
        >
          <Text style={[styles.filterText, filter === 'done' && styles.filterTextActive]}>Done ({doneCount})</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTasks}
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
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: '#4F46E5',
  },
  filterText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  taskCard: {
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    fontSize: 18,
    color: '#4F46E5',
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  taskDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
});