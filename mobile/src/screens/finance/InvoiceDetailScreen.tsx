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

type InvoiceDetailScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { invoiceId: string } }, 'params'>;
};

const MOCK_LINE_ITEMS = [
  { id: '1', description: 'Platform License (Annual)', quantity: 1, unitPrice: 8000.00, total: 8000.00 },
  { id: '2', description: 'Implementation Services', quantity: 20, unitPrice: 150.00, total: 3000.00 },
  { id: '3', description: 'Priority Support Package', quantity: 1, unitPrice: 1500.00, total: 1500.00 },
];

const MOCK_INVOICE = {
  id: '1',
  number: 'INV-2026-001',
  clientName: 'Acme Corporation',
  clientEmail: 'billing@acme.com',
  clientAddress: '100 Enterprise Ave, New York, NY 10001',
  amount: 12500.00,
  subtotal: 12500.00,
  tax: 0,
  status: 'sent',
  dueDate: '2026-04-01',
  createdAt: '2026-03-01',
  notes: 'Payment due within 30 days. Wire transfer preferred.',
};

export default function InvoiceDetailScreen({ navigation, route }: InvoiceDetailScreenProps) {
  const { invoiceId } = route.params;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'sent': return '#4F46E5';
      case 'overdue': return '#EF4444';
      case 'draft': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.invoiceNumber}>{MOCK_INVOICE.number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(MOCK_INVOICE.status) }]}>
          <Text style={styles.statusText}>{MOCK_INVOICE.status.toUpperCase()}</Text>
        </View>
        <Text style={styles.amount}>
          ${MOCK_INVOICE.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client Information</Text>
        <View style={styles.card}>
          <InfoRow label="Client" value={MOCK_INVOICE.clientName} />
          <InfoRow label="Email" value={MOCK_INVOICE.clientEmail} />
          <InfoRow label="Address" value={MOCK_INVOICE.clientAddress} />
          <InfoRow label="Invoice Date" value={MOCK_INVOICE.createdAt} />
          <InfoRow label="Due Date" value={MOCK_INVOICE.dueDate} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Line Items</Text>
        <View style={styles.card}>
          <View style={styles.lineItemHeader}>
            <Text style={[styles.lineItemCol, { flex: 2 }]}>Description</Text>
            <Text style={styles.lineItemCol}>Qty</Text>
            <Text style={styles.lineItemCol}>Price</Text>
            <Text style={[styles.lineItemCol, { textAlign: 'right' }]}>Total</Text>
          </View>
          {MOCK_LINE_ITEMS.map((item, index) => (
            <View key={item.id} style={[styles.lineItemRow, index < MOCK_LINE_ITEMS.length - 1 && styles.lineItemBorder]}>
              <Text style={[styles.lineItemText, { flex: 2 }]}>{item.description}</Text>
              <Text style={styles.lineItemText}>{item.quantity}</Text>
              <Text style={styles.lineItemText}>${item.unitPrice.toFixed(2)}</Text>
              <Text style={[styles.lineItemText, { textAlign: 'right', fontWeight: '600' }]}>${item.total.toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              ${MOCK_INVOICE.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>

      {MOCK_INVOICE.notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notes}>{MOCK_INVOICE.notes}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#4F46E5' }]}
          onPress={() => Alert.alert('Send Invoice', 'Invoice sent to client.')}
        >
          <Text style={styles.actionBtnText}>📤 Send</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
          onPress={() => Alert.alert('Mark Paid', 'Invoice marked as paid.')}
        >
          <Text style={styles.actionBtnText}>✓ Mark Paid</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#6B7280' }]}
          onPress={() => Alert.alert('Download', 'PDF download started.')}
        >
          <Text style={styles.actionBtnText}>⬇ Download</Text>
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
    padding: 24,
    alignItems: 'center',
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  amount: {
    fontSize: 36,
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
  lineItemHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    marginBottom: 4,
  },
  lineItemCol: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  lineItemRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
  },
  lineItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lineItemText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4F46E5',
  },
  notes: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
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
