import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';

type NotificationItem = {
  _id: string;
  type?: string;
  title?: string;
  message?: string;
  isRead?: boolean;
  createdAt?: string;
  sender?: { _id?: string; name?: string } | string | null;
  relatedId?: string | null;
  relatedType?: string | null;
};

type Props = {
  onBack: () => void;
};


const getIcon = (type?: string): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'message':
      return 'chatbubble-ellipses-outline';
    case 'booking':
    case 'booking_approved':
      return 'calendar-outline';
    case 'booking_rejected':
      return 'close-circle-outline';
    case 'booking_cancelled':
      return 'calendar-clear-outline';
    default:
      return 'notifications-outline';
  }
};


const getIconColor = (type?: string) => {
  switch (type) {
    case 'message':
      return '#2874C7';
    case 'booking_approved':
      return '#1C9A70';
    case 'booking_rejected':
    case 'booking_cancelled':
      return '#D65B63';
    default:
      return '#667C95';
  }
};


const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};


export default function NotificationScreen({ onBack }: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await api.getNotifications();
      setNotifications(Array.isArray(response?.notifications) ? response.notifications : []);
      setUnreadCount(Number(response?.unreadCount || 0));
    } catch (error: any) {
      console.error('Load notifications error:', error?.message);
      Alert.alert('Notifications', error?.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markRead = async (item: NotificationItem) => {
    if (item.isRead || actionId) return;
    try {
      setActionId(item._id);
      await api.markNotificationAsRead(item._id);
      setNotifications((current) => current.map((notification) =>
        notification._id === item._id ? { ...notification, isRead: true } : notification,
      ));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error: any) {
      Alert.alert('Update failed', error?.message || 'Could not mark notification as read.');
    } finally {
      setActionId(null);
    }
  };


  const markAllRead = async () => {
    if (unreadCount === 0 || actionId) return;
    try {
      setActionId('all');
      await api.markAllNotificationsAsRead();
      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
      setUnreadCount(0);
    } catch (error: any) {
      Alert.alert('Update failed', error?.message || 'Could not mark all notifications as read.');
    } finally {
      setActionId(null);
    }
  };


  const deleteNotification = (item: NotificationItem) => {
    Alert.alert('Delete notification', 'Remove this notification from your list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionId(item._id);
            await api.deleteNotification(item._id);
            setNotifications((current) => current.filter((notification) => notification._id !== item._id));
            if (!item.isRead) setUnreadCount((count) => Math.max(0, count - 1));
          } catch (error: any) {
            Alert.alert('Delete failed', error?.message || 'Could not delete notification.');
          } finally {
            setActionId(null);
          }
        },
      },
    ]);
  };


  const renderItem = ({ item }: { item: NotificationItem }) => {
    const color = getIconColor(item.type);
    return (
      <Pressable
        onPress={() => markRead(item)}
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${color}15` }]}>
          <Ionicons name={getIcon(item.type)} size={22} color={color} />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]} numberOfLines={2}>
              {item.title || 'StayFinder Notification'}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage}>{item.message || 'You have a new update.'}</Text>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
        <Pressable
          onPress={() => deleteNotification(item)}
          hitSlop={8}
          style={styles.deleteButton}
          accessibilityLabel="Delete notification"
        >
          <Ionicons name="trash-outline" size={18} color="#93A3B5" />
        </Pressable>
      </Pressable>
    );
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={23} color="#17324F" />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'You’re all caught up'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={markAllRead} disabled={!!actionId} style={styles.readAllButton}>
            {actionId === 'all' ? <ActivityIndicator size="small" color="#2874C7" /> : <Text style={styles.readAllText}>Read all</Text>}
          </Pressable>
        )}
      </View>


      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#2874C7" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-outline" size={38} color="#2874C7" />
          </View>
          <Text style={styles.emptyTitle}>All quiet for now</Text>
          <Text style={styles.emptyMessage}>Your messages, booking updates, and important alerts will appear here.</Text>
          <Pressable style={styles.refreshButton} onPress={() => loadNotifications(true)}>
            <Ionicons name="refresh" size={16} color="#2874C7" />
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} tintColor="#2874C7" colors={['#2874C7']} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FC' },
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    paddingHorizontal: 17, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E8EEF5',
  },
  backButton: { width: 35, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 19, fontWeight: '900', color: '#17324F' },
  headerSubtitle: { fontSize: 11, color: '#8292A5', marginTop: 3 },
  readAllButton: { minWidth: 56, alignItems: 'center', justifyContent: 'center', paddingVertical: 7, paddingHorizontal: 8 },
  readAllText: { color: '#2874C7', fontSize: 12, fontWeight: '800' },
  listContent: { padding: 14, paddingBottom: 24 },
  notificationCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EAF0F6',
  },
  unreadCard: { backgroundColor: '#F9FCFF', borderColor: '#D5E8FA' },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  notificationContent: { flex: 1, paddingTop: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  notificationTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: '#28435F' },
  unreadTitle: { fontWeight: '900', color: '#17324F' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2874C7' },
  notificationMessage: { fontSize: 12, lineHeight: 18, color: '#6F8298', marginTop: 5 },
  dateText: { fontSize: 10, color: '#98A6B6', marginTop: 8 },
  deleteButton: { padding: 5, marginLeft: 5, marginTop: 1 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 12, color: '#8292A5', marginTop: 10 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  emptyIcon: { width: 76, height: 76, borderRadius: 24, backgroundColor: '#EAF3FD', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '900', color: '#17324F', marginTop: 16 },
  emptyMessage: { fontSize: 12, color: '#8494A7', textAlign: 'center', lineHeight: 19, marginTop: 7 },
  refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, backgroundColor: '#EAF3FD', marginTop: 18 },
  refreshText: { fontSize: 12, fontWeight: '800', color: '#2874C7' },
});
