import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LeaveRequest } from '../../types';

export default function LeaveRequestsScreen() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    { id: '1', employeeId: '4', employeeName: 'James Wilson', type: 'vacation', startDate: '2024-03-10', endDate: '2024-03-15', status: 'approved', reason: 'Family vacation' },
    { id: '2', employeeId: '7', employeeName: 'Anna Taylor', type: 'sick', startDate: '2024-03-18', endDate: '2024-03-19', status: 'pending', reason: 'Medical appointment' },
    { id: '3', employeeId: '2', employeeName: 'Mike Chen', type: 'personal', startDate: '2024-03-25', endDate: '2024-03-25', status: 'pending', reason: 'Personal matter' },
    { id: '4', employeeId: '5', employeeName: 'Lisa Brown', type: 'vacation', startDate: '2024-04-01', endDate: '2024-04-10', status: 'pending', reason: 'Holiday trip' },
    { id: '5', employeeId: '8', employeeName: 'Robert Anderson', type: 'sick', startDate: '2024-03-05', endDate: '2024-03-07', status: 'rejected', reason: 'Doctor advised rest' },
  ]);
  const [refreshing, setRefreshing] = useState(false);

  const pendingCount = leaveRequests.filter(r => r.status === 'pending').length;

  async function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vacation': return '🏖️';
      case 'sick': return '🤒';
      case 'personal': return '👤';
      default: return '📅';
    }
  };

  const renderItem = ({ item }: { item: LeaveRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{item.employeeName}</Text>
          <View style={styles.typeTag}>
            <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.dates}>
        <Text style={styles.dateLabel}>📅 {item.startDate} → {item.endDate}</Text>
      </View>
      {item.reason && <Text style={styles.reason}>{item.reason}</Text>}
      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.approveButton}>
            <Text style={styles.approveText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton}>
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{leaveRequests.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>
            {leaveRequests.filter(r => r.status === 'approved').length}
          </Text>
          <Text style={styles.summaryLabel}>Approved</Text>
        </View>
      </View>

      <FlatList
        data={leaveRequests}
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
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  typeText: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dates: {
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#374151',
  },
  reason: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  approveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  rejectText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});