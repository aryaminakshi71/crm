import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Product } from '../../types';

type ProductDetailScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { productId: string } }, 'params'>;
};

const MOCK_TRANSACTIONS = [
  { id: '1', type: 'Sale', quantity: -5, date: '2026-03-22', reference: 'ORD-1042' },
  { id: '2', type: 'Restock', quantity: +50, date: '2026-03-20', reference: 'PO-0391' },
  { id: '3', type: 'Sale', quantity: -12, date: '2026-03-18', reference: 'ORD-1038' },
];

const MOCK_PRODUCT: Product & { description: string; warehouseLocation: string } = {
  id: '1',
  name: 'Wireless Keyboard Pro',
  sku: 'WKB-001',
  category: 'Electronics',
  price: 89.99,
  stock: 142,
  status: 'in_stock',
  description: 'Full-size wireless keyboard with ergonomic design, backlit keys, and 12-month battery life. Compatible with Windows, macOS, and Linux.',
  warehouseLocation: 'Shelf A3, Bay 12',
};

export default function ProductDetailScreen({ navigation, route }: ProductDetailScreenProps) {
  const { productId } = route.params;
  const [stock, setStock] = useState(MOCK_PRODUCT.stock);
  const [customQty, setCustomQty] = useState('');

  const getStatusColor = (qty: number) => {
    if (qty === 0) return '#EF4444';
    if (qty < 10) return '#F59E0B';
    return '#10B981';
  };

  const getStatusLabel = (qty: number) => {
    if (qty === 0) return 'Out of Stock';
    if (qty < 10) return 'Low Stock';
    return 'In Stock';
  };

  const handleSetQuantity = () => {
    const qty = parseInt(customQty, 10);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid non-negative number.');
      return;
    }
    setStock(qty);
    setCustomQty('');
    Alert.alert('Stock Updated', `Stock set to ${qty} units.`);
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
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(stock) }]}>
          <Text style={styles.statusText}>{getStatusLabel(stock)}</Text>
        </View>
        <Text style={styles.productName}>{MOCK_PRODUCT.name}</Text>
        <Text style={styles.sku}>SKU: {MOCK_PRODUCT.sku}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Details</Text>
        <View style={styles.card}>
          <InfoRow label="Category" value={MOCK_PRODUCT.category} />
          <InfoRow label="Price" value={`$${MOCK_PRODUCT.price.toFixed(2)}`} />
          <InfoRow label="Location" value={MOCK_PRODUCT.warehouseLocation} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Stock</Text>
            <Text style={[styles.infoValue, { color: getStatusColor(stock), fontWeight: '700' }]}>
              {stock} units
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.card}>
          <Text style={styles.description}>{MOCK_PRODUCT.description}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stock Adjustment</Text>
        <View style={styles.card}>
          <View style={styles.adjustRow}>
            <TouchableOpacity
              style={[styles.adjustBtn, { backgroundColor: '#EF4444' }]}
              onPress={() => setStock(prev => Math.max(0, prev - 1))}
            >
              <Text style={styles.adjustBtnText}>− 1</Text>
            </TouchableOpacity>
            <View style={styles.stockDisplay}>
              <Text style={[styles.currentStock, { color: getStatusColor(stock) }]}>{stock}</Text>
              <Text style={styles.stockUnit}>units</Text>
            </View>
            <TouchableOpacity
              style={[styles.adjustBtn, { backgroundColor: '#10B981' }]}
              onPress={() => setStock(prev => prev + 1)}
            >
              <Text style={styles.adjustBtnText}>+ 1</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.customRow}>
            <TextInput
              style={styles.customInput}
              placeholder="Enter quantity"
              value={customQty}
              onChangeText={setCustomQty}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.setBtn} onPress={handleSetQuantity}>
              <Text style={styles.setBtnText}>Set Quantity</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        <View style={styles.card}>
          {MOCK_TRANSACTIONS.map((tx, index) => (
            <View key={tx.id} style={[styles.txRow, index < MOCK_TRANSACTIONS.length - 1 && styles.txBorder]}>
              <View style={styles.txLeft}>
                <Text style={styles.txType}>{tx.type}</Text>
                <Text style={styles.txRef}>{tx.reference} · {tx.date}</Text>
              </View>
              <Text style={[styles.txQty, { color: tx.quantity > 0 ? '#10B981' : '#EF4444' }]}>
                {tx.quantity > 0 ? '+' : ''}{tx.quantity}
              </Text>
            </View>
          ))}
        </View>
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
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  sku: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
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
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  adjustBtn: {
    width: 80,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  adjustBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  stockDisplay: {
    alignItems: 'center',
  },
  currentStock: {
    fontSize: 36,
    fontWeight: '700',
  },
  stockUnit: {
    fontSize: 12,
    color: '#6B7280',
  },
  customRow: {
    flexDirection: 'row',
    gap: 10,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  setBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  setBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  txBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  txLeft: {
    flex: 1,
  },
  txType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  txRef: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  txQty: {
    fontSize: 16,
    fontWeight: '700',
  },
});
