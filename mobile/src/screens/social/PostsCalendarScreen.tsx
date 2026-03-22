import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { api } from '../../services/api';
import { SocialPost } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type PostsCalendarScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const MOCK_POSTS: SocialPost[] = [
  { id: '1', platform: 'LinkedIn', content: 'Excited to announce Nucleo One v2.0 is live! The all-in-one platform for modern businesses. Check out what\'s new in the link below. #ProductLaunch #SaaS', scheduledAt: '2026-03-22T10:00:00Z', status: 'scheduled' },
  { id: '2', platform: 'Twitter', content: '🚀 Nucleo One v2.0 is here. New AI Agents, Field Service module, and so much more. Try it free → nucleo.one #NucleoOne', scheduledAt: '2026-03-22T10:05:00Z', status: 'scheduled' },
  { id: '3', platform: 'Instagram', content: 'Introducing AI-powered workflows that actually work for your business. Swipe to see what\'s new in Nucleo One v2.0 ✨', scheduledAt: '2026-03-22T11:00:00Z', status: 'scheduled' },
  { id: '4', platform: 'Facebook', content: 'Big news! We\'ve launched Nucleo One v2.0 with 8 new modules including Helpdesk, Finance, and AI Agents. Your team will love it.', scheduledAt: '2026-03-21T09:00:00Z', status: 'published' },
  { id: '5', platform: 'LinkedIn', content: 'Behind the scenes: How our engineering team built AI Agents for enterprise workflows in under 6 months.', scheduledAt: '2026-03-20T14:00:00Z', status: 'published' },
  { id: '6', platform: 'Twitter', content: 'Weekly tip: Use Nucleo One\'s HRM module to streamline your entire employee lifecycle from hire to retire. #HRtech', scheduledAt: '2026-03-19T08:00:00Z', status: 'failed' },
];

const PLATFORM_COLORS: Record<string, string> = {
  Twitter: '#1DA1F2',
  LinkedIn: '#0A66C2',
  Instagram: '#E1306C',
  Facebook: '#1877F2',
};

const PLATFORM_ICONS: Record<string, string> = {
  Twitter: '𝕏',
  LinkedIn: 'in',
  Instagram: '📷',
  Facebook: 'f',
};

export default function PostsCalendarScreen({ navigation }: PostsCalendarScreenProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const data = await api.getSocialPosts();
      setPosts(data);
    } catch (error) {
      setPosts(MOCK_POSTS);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#4F46E5';
      case 'published': return '#10B981';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return '🕐';
      case 'published': return '✓';
      case 'failed': return '✗';
      default: return '•';
    }
  };

  const renderItem = ({ item }: { item: SocialPost }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.platformBadge, { backgroundColor: PLATFORM_COLORS[item.platform] || '#6B7280' }]}>
          <Text style={styles.platformIcon}>{PLATFORM_ICONS[item.platform] || item.platform[0]}</Text>
          <Text style={styles.platformName}>{item.platform}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.content} numberOfLines={3}>{item.content}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.scheduledAt}>
          {new Date(item.scheduledAt).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        {item.status === 'scheduled' && (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => Alert.alert('Edit Post', 'Post editor would open here.')}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.newPostBtn}
        onPress={() => Alert.alert('New Post', 'Create post form would open here.')}
      >
        <Text style={styles.newPostBtnText}>+ New Post</Text>
      </TouchableOpacity>

      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No posts scheduled</Text>
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
  newPostBtn: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  newPostBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  list: {
    padding: 16,
    paddingTop: 8,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  platformIcon: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  platformName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusIcon: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  scheduledAt: {
    fontSize: 12,
    color: '#6B7280',
  },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  editBtnText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
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
