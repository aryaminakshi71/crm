import React, { useState } from 'react';
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
import { Ticket } from '../../types';

type TicketDetailScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { ticketId: string } }, 'params'>;
};

const MOCK_ACTIVITY = [
  { id: '1', actor: 'Sarah Chen', action: 'changed status to In Progress', time: '2026-03-22T09:00:00Z' },
  { id: '2', actor: 'Mike Torres', action: 'added a comment: "Reproduced the issue on staging."', time: '2026-03-22T08:30:00Z' },
  { id: '3', actor: 'System', action: 'ticket created and assigned to Sarah Chen', time: '2026-03-22T08:00:00Z' },
];

const MOCK_TICKET: Ticket = {
  id: '1',
  title: 'Cannot login to dashboard',
  description: 'User reports a 403 Forbidden error when attempting to login to the admin dashboard. Affects multiple accounts. Investigated and found a misconfigured CORS policy after a recent deployment.',
  status: 'in_progress',
  priority: 'urgent',
  assignee: 'Sarah Chen',
  slaMinutes: 45,
  createdAt: '2026-03-22T08:00:00Z',
};

export default function TicketDetailScreen({ navigation, route }: TicketDetailScreenProps) {
  const { ticketId } = route.params;
  const [ticket, setTicket] = useState<Ticket>(MOCK_TICKET);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#4F46E5';
      case 'in_progress': return '#F59E0B';
      case 'resolved': return '#10B981';
      case 'closed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#4F46E5';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  const handleResolve = () => {
    setTicket(prev => ({ ...prev, status: 'resolved' }));
    Alert.alert('Ticket Resolved', 'The ticket has been marked as resolved.');
  };

  const handleEscalate = () => {
    setTicket(prev => ({ ...prev, priority: 'urgent' }));
    Alert.alert('Ticket Escalated', 'The ticket has been escalated.');
  };

  const handleReply = () => {
    Alert.alert('Reply', 'Reply editor would open here.');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerBadges}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
            <Text style={styles.badgeText}>{ticket.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
            <Text style={styles.badgeText}>{ticket.priority.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.title}>{ticket.title}</Text>
        {ticket.slaMinutes !== undefined && ticket.slaMinutes > 0 && (
          <Text style={[styles.sla, { color: ticket.slaMinutes < 60 ? '#EF4444' : '#F59E0B' }]}>
            ⏱ SLA: {ticket.slaMinutes >= 60 ? `${Math.floor(ticket.slaMinutes / 60)}h ${ticket.slaMinutes % 60}m` : `${ticket.slaMinutes}m`} remaining
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.card}>
          <InfoRow label="Assignee" value={ticket.assignee || 'Unassigned'} />
          <InfoRow label="Created" value={new Date(ticket.createdAt).toLocaleString()} />
          <InfoRow label="Priority" value={ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} />
          <InfoRow label="Status" value={ticket.status.replace('_', ' ')} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.card}>
          <Text style={styles.description}>{ticket.description || 'No description provided.'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Log</Text>
        <View style={styles.card}>
          {MOCK_ACTIVITY.map((activity, index) => (
            <View key={activity.id} style={[styles.activityItem, index < MOCK_ACTIVITY.length - 1 && styles.activityBorder]}>
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  <Text style={styles.activityActor}>{activity.actor}</Text>
                  {' '}{activity.action}
                </Text>
                <Text style={styles.activityTime}>{new Date(activity.time).toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
          onPress={handleResolve}
        >
          <Text style={styles.actionBtnText}>✓ Resolve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
          onPress={handleEscalate}
        >
          <Text style={styles.actionBtnText}>↑ Escalate</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.replyButton} onPress={handleReply}>
        <Text style={styles.replyButtonText}>💬 Reply</Text>
      </TouchableOpacity>
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  sla: {
    fontSize: 13,
    fontWeight: '600',
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
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginTop: 5,
    marginRight: 10,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  activityActor: {
    fontWeight: '600',
    color: '#111827',
  },
  activityTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  replyButton: {
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  replyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
