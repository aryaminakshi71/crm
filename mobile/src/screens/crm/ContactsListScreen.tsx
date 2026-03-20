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
import { Contact } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ContactsListScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ContactsListScreen({ navigation }: ContactsListScreenProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = contacts.filter(
        c =>
          c.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.company?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  async function fetchContacts() {
    try {
      const data = await api.getContacts();
      setContacts(data);
      setFilteredContacts(data);
    } catch (error) {
      // Mock data for demo
      setContacts([
        { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', company: 'Acme Inc', status: 'customer', createdAt: '2024-01-15' },
        { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', company: 'Tech Corp', status: 'lead', createdAt: '2024-01-20' },
        { id: '3', firstName: 'Bob', lastName: 'Wilson', email: 'bob@example.com', company: 'Global Ltd', status: 'active', createdAt: '2024-02-01' },
        { id: '4', firstName: 'Alice', lastName: 'Brown', email: 'alice@example.com', company: 'StartUp Inc', status: 'customer', createdAt: '2024-02-10' },
        { id: '5', firstName: 'Charlie', lastName: 'Davis', email: 'charlie@example.com', company: 'Big Corp', status: 'lead', createdAt: '2024-02-15' },
      ]);
      setFilteredContacts([
        { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', company: 'Acme Inc', status: 'customer', createdAt: '2024-01-15' },
        { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', company: 'Tech Corp', status: 'lead', createdAt: '2024-01-20' },
        { id: '3', firstName: 'Bob', lastName: 'Wilson', email: 'bob@example.com', company: 'Global Ltd', status: 'active', createdAt: '2024-02-01' },
        { id: '4', firstName: 'Alice', lastName: 'Brown', email: 'alice@example.com', company: 'StartUp Inc', status: 'customer', createdAt: '2024-02-10' },
        { id: '5', firstName: 'Charlie', lastName: 'Davis', email: 'charlie@example.com', company: 'Big Corp', status: 'lead', createdAt: '2024-02-15' },
      ]);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchContacts();
    setRefreshing(false);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'customer': return '#10B981';
      case 'lead': return '#F59E0B';
      case 'active': return '#4F46E5';
      case 'inactive': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const renderItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactCard}
      onPress={() => navigation.navigate('ContactDetail', { contactId: item.id })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.firstName[0]}{item.lastName[0]}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.contactEmail}>{item.email}</Text>
        {item.company && <Text style={styles.contactCompany}>{item.company}</Text>}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredContacts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No contacts found</Text>
          </View>
        }
      />

      <View style={styles.tabs}>
        <TouchableOpacity style={styles.tab} onPress={() => {}}>
          <Text style={styles.tabText}>Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, styles.tabActive]} onPress={() => navigation.navigate('LeadsList')}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, styles.tabActive]} onPress={() => navigation.navigate('DealsList')}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Deals</Text>
        </TouchableOpacity>
      </View>
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
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  contactEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  contactCompany: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
});