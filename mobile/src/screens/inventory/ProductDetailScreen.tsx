import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Product } from '../../types';
import { api } from '../../services/api';

type ProductDetailScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { productId: string } }, 'params'>;
};

export default function ProductDetailScreen({ navigation, route }: ProductDetailScreenProps) {
  const { productId } = route.params;
  const [product, setProduct] = useState<any>(null);
  const [stock, setStock] = useState(0);
  const [loading, setLoading] = useState(true);
  const [customQty, setCustomQty] = useState('');

  useEffect(() => {
    fetchProduct();
  }, []);

  async function fetchProduct() {
    try {
      const data = await api.getProduct(productId);
      setProduct(data);
      setStock(data.stock ?? data.quantity ?? 0);
    } catch (error) {
      Alert.alert('Error', 'Could not load product details.');
    } finally {
      setLoading(false);
    }
  }

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Product not found.</Text>
      </View>
    );
  }

  const transactions: any[] = product.transactions ?? product.transactionHistory ?? [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(stock) }]}>
          <Text style={styles.statusText}>{getStatusLabel(stock)}</Text>
        </View>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.sku}>SKU: {product.sku}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Details</Text>
        <View style={styles.card}>
          <InfoRow label="Category" value={product.category ?? '—'} />
          <InfoRow label="Price" value={`$${Number(product.price ?? 0).toFixed(2)}`} />
          {product.warehouseLocation ? <InfoRow label="Location" value={product.warehouseLocation} /> : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Stock</Text>
            <Text style={[styles.infoValue, { color: getStatusColor(stock), fontWeight: '700' }]}>
              {stock} units
            </Text>
          </View>
        </View>
      </View>

      {product.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.card}>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        </View>
      ) : null}

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

      {transactions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <View style={styles.card}>
            {transactions.map((tx: any, index: number) => (
              <View key={tx.id ?? index} style={[styles.txRow, index < transactions.length - 1 && styles.txBorder]}>
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
      )}
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
