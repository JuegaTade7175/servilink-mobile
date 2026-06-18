import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { notificationsApi } from '../../api';
import type { Notification } from '../../types';

const TYPE_ICONS: Record<string, string> = {
  BOOKING_CREATED: '📅', BOOKING_CONFIRMED: '✅', BOOKING_CANCELLED: '❌',
  BOOKING_COMPLETED: '🎉', PAYMENT_RECEIVED: '💳', NEW_MESSAGE: '💬', NEW_REVIEW: '⭐',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

interface Props { onBack: () => void; }

export default function NotificationsScreen({ onBack }: Props) {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await notificationsApi.getAll();
      setNotifs(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await notificationsApi.markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
    setMarking(false);
  };

  const unreadCount = notifs.filter(n => !n.isRead).length;

  const renderItem = ({ item }: { item: Notification }) => (
    <View style={[s.item, !item.isRead && s.itemUnread]}>
      <Text style={s.icon}>{TYPE_ICONS[item.type] ?? '🔔'}</Text>
      <View style={s.itemBody}>
        <Text style={[s.itemTitle, !item.isRead && s.itemTitleUnread]}>{item.title}</Text>
        <Text style={s.itemBody2}>{item.body}</Text>
        <Text style={s.itemDate}>{fmtDate(item.createdAt)}</Text>
      </View>
      {!item.isRead && <View style={s.dot} />}
    </View>
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>
          Notificaciones{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} disabled={marking} style={s.readAllBtn}>
            {marking
              ? <ActivityIndicator size="small" color="#6c63ff" />
              : <Text style={s.readAllText}>Leer todas</Text>}
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#6c63ff" />
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          contentContainerStyle={notifs.length === 0 ? s.emptyContainer : undefined}
          ListEmptyComponent={
            <View style={s.centered}>
              <Text style={s.emptyIcon}>🔔</Text>
              <Text style={s.emptyTitle}>Sin notificaciones</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={s.separator} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb', elevation: 2,
  },
  backBtn: { padding: 8, marginRight: 4 },
  backText: { fontSize: 22, color: '#6c63ff' },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: '#1f2937' },
  readAllBtn: { padding: 8 },
  readAllText: { fontSize: 13, color: '#6c63ff', fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyContainer: { flex: 1 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 15, color: '#6b7280' },
  item: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  itemUnread: { backgroundColor: '#f5f3ff' },
  icon: { fontSize: 22, marginTop: 2 },
  itemBody: { flex: 1 },
  itemBody2: { fontSize: 13, color: '#6b7280', marginTop: 2, lineHeight: 18 },
  itemTitle: { fontSize: 14, color: '#374151', fontWeight: '500' },
  itemTitleUnread: { fontWeight: '700', color: '#1f2937' },
  itemDate: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#6c63ff', marginTop: 6, flexShrink: 0,
  },
  separator: { height: 1, backgroundColor: '#f3f4f6' },
});
