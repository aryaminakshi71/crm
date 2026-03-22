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
import { Product } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ProductsListScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Wireless Keyboard Pro', sku: 'WKB-001', category: 'Electronics', price: 89.99, stock: 142, status: 'in_stock' },
  { id: '2', name: 'USB-C Hub 7-in-1', sku: 'UCH-007', category: 'Electronics', price: 49.99, stock: 7, status: 'low_stock' },
  { id: '3', name: 'Standing Desk Mat', sku: 'SDM-002', category: 'Office Furniture', price: 35.00, stock: 0, status: 'out_of_stock' },
  { id: '4', name: 'Ergonomic Mouse', sku: 'EMO-003', category: 'Electronics', price: 65.00, stock: 88, status: 'in_stock' },
  { id: '5', name: 'Monitor Arm Dual', sku: 'MAD-004', category: 'Office Furniture', price: 120.00, stock: 5, status: 'low_stock' },
  { id: '6', name: 'Noise Cancelling Headset', sku: 'NCH-005', category: 'Electronics', price: 199.99, stock: 34, status: 'in_stock' },
  { id: '7', name: 'Cable Management Kit', sku: 'CMK-006', category: 'Accessories', price: 18.50, stock: 210, status: 'in_stock' },
  { id: '8', name: 'Webcam 4K Ultra', sku: 'WC4K-008', category: 'Electronics', price: 149.00, stock: 3, status: 'low_stock' },
];

export default function ProductsListScreen({ navigation }: ProductsListScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredProducts(
        products.filter(
          p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  async function fetchProducts() {
    try {
      const data = await api.getProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      setProducts(MOCK_PRODUCTS);
      setFilteredProducts(MOCK_PRODUCTS);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return '#10B981';
      case 'low_stock': return '#F59E0B';
      case 'out_of_stock': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock': return 'In Stock';
      case 'low_stock': return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      default: return status;
    }
  };

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <View style={styles.nameRow}>
            <Text style={styles.productName}>{item.name}</Text>
            {item.stock < 10 && item.stock > 0 && (
              <View style={styles.lowStockBadge}>
                <Text style={styles.lowStockText}>LOW</Text>
              </View>
            )}
          </View>
          <Text style={styles.sku}>SKU: {item.sku}</Text>
          <Text style={styles.category}>{item.category}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          <Text style={styles.stockQty}>
            {item.stock === 0 ? 'Out of stock' : `${item.stock} units`}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No products found</Text>
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
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flex: 1,
    marginRight: 12,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  lowStockBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lowStockText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  sku: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  stockQty: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
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
