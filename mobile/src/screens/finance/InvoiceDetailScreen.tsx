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
import { api } from '../../services/api';

type InvoiceDetailScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { invoiceId: string } }, 'params'>;
};

export default function InvoiceDetailScreen({ navigation, route }: InvoiceDetailScreenProps) {
  const { invoiceId } = route.params;
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, []);

  async function fetchInvoice() {
    try {
      const data = await api.getInvoice(invoiceId);
      setInvoice(data);
    } catch (error) {
      Alert.alert('Error', 'Could not load invoice details.');
    } finally {
      setLoading(false);
    }
  }

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Invoice not found.</Text>
      </View>
    );
  }

  const lineItems: any[] = invoice.lineItems ?? invoice.items ?? [];
  const amount = invoice.amount ?? invoice.total ?? 0;
  const status = invoice.status ?? 'draft';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.invoiceNumber}>{invoice.number ?? invoice.invoiceNumber ?? `INV-${invoiceId}`}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
          <Text style={styles.statusText}>{status.toUpperCase()}</Text>
        </View>
        <Text style={styles.amount}>
          ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client Information</Text>
        <View style={styles.card}>
          <InfoRow label="Client" value={invoice.clientName ?? invoice.client ?? '—'} />
          {invoice.clientEmail ? <InfoRow label="Email" value={invoice.clientEmail} /> : null}
          {invoice.clientAddress ? <InfoRow label="Address" value={invoice.clientAddress} /> : null}
          {invoice.createdAt ? <InfoRow label="Invoice Date" value={new Date(invoice.createdAt).toLocaleDateString()} /> : null}
          {invoice.dueDate ? <InfoRow label="Due Date" value={invoice.dueDate} /> : null}
        </View>
      </View>

      {lineItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items</Text>
          <View style={styles.card}>
            <View style={styles.lineItemHeader}>
              <Text style={[styles.lineItemCol, { flex: 2 }]}>Description</Text>
              <Text style={styles.lineItemCol}>Qty</Text>
              <Text style={styles.lineItemCol}>Price</Text>
              <Text style={[styles.lineItemCol, { textAlign: 'right' }]}>Total</Text>
            </View>
            {lineItems.map((item: any, index: number) => (
              <View key={item.id ?? index} style={[styles.lineItemRow, index < lineItems.length - 1 && styles.lineItemBorder]}>
                <Text style={[styles.lineItemText, { flex: 2 }]}>{item.description}</Text>
                <Text style={styles.lineItemText}>{item.quantity}</Text>
                <Text style={styles.lineItemText}>${Number(item.unitPrice ?? item.price ?? 0).toFixed(2)}</Text>
                <Text style={[styles.lineItemText, { textAlign: 'right', fontWeight: '600' }]}>
                  ${Number(item.total ?? item.amount ?? 0).toFixed(2)}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>
                ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>
      )}

      {invoice.notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notes}>{invoice.notes}</Text>
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
