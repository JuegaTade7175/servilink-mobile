import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { bookingsApi, messagesApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import type { Booking, Message } from '../../types';
import ChatScreen from './ChatScreen';

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#6c63ff',
  IN_PROGRESS: '#8b5cf6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

function Avatar({ name }: { name: string }) {
  const COLORS = ['#6c63ff', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#10b981'];
  const color = COLORS[(name || 'U').charCodeAt(0) % COLORS.length];
  const initials = (name || 'U')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View style={[av.circle, { backgroundColor: color }]}>
      <Text style={av.text}>{initials}</Text>
    </View>
  );
}

const av = StyleSheet.create({
  circle: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  text: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

export default function ChatListScreen() {
  const { userId } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastMessages, setLastMessages] = useState<Record<number, Message>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);

  const loadBookings = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const data = await bookingsApi.myBookings();
      const sorted = [...data].sort((a, b) => {
        if (a.status === 'CANCELLED' && b.status !== 'CANCELLED') return 1;
        if (b.status === 'CANCELLED' && a.status !== 'CANCELLED') return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setBookings(sorted);

      // Load last messages and unread counts for active bookings
      const active = sorted.filter(b => b.status !== 'CANCELLED').slice(0, 10);
      const results = await Promise.all(
        active.map(b =>
          messagesApi.getByBooking(b.id)
            .then(msgs => ({ id: b.id, msgs }))
            .catch(() => ({ id: b.id, msgs: [] as Message[] }))
        )
      );
      const lm: Record<number, Message> = {};
      const uc: Record<number, number> = {};
      for (const { id, msgs } of results) {
        if (msgs.length > 0) lm[id] = msgs[msgs.length - 1];
        uc[id] = msgs.filter(m => !m.isRead && m.receiverId === userId).length;
      }
      setLastMessages(lm);
      setUnreadCounts(uc);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [userId]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const handleSelect = (b: Booking) => {
    setSelected(b);
    setUnreadCounts(prev => ({ ...prev, [b.id]: 0 }));
  };

  if (selected) {
    return (
      <ChatScreen
        booking={selected}
        onBack={() => { setSelected(null); loadBookings(); }}
      />
    );
  }

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    return (
      b.professionalName?.toLowerCase().includes(q) ||
      b.clientName?.toLowerCase().includes(q) ||
      b.serviceName?.toLowerCase().includes(q)
    );
  });

  const totalUnread = Object.values(unreadCounts).reduce((a, c) => a + c, 0);

  const renderItem = ({ item }: { item: Booking }) => {
    const isClient = userId === item.clientId;
    const otherName = isClient ? item.professionalName : item.clientName;
    const lastMsg = lastMessages[item.id];
    const unread = unreadCounts[item.id] ?? 0;
    const statusColor = STATUS_COLORS[item.status] ?? '#6b7280';

    return (
      <TouchableOpacity
        style={[s.item, unread > 0 && s.itemUnread]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.75}
      >
        <View style={s.avatarWrap}>
          <Avatar name={otherName} />
          {/* Status dot */}
          <View style={[s.statusDot, { backgroundColor: statusColor }]} />
        </View>

        <View style={s.itemContent}>
          <View style={s.itemTop}>
            <Text style={[s.otherName, unread > 0 && s.otherNameBold]} numberOfLines={1}>
              {otherName}
            </Text>
            {lastMsg && (
              <Text style={s.timeText}>{fmtTime(lastMsg.createdAt)}</Text>
            )}
          </View>
          <Text style={s.svcName} numberOfLines={1}>🔧 {item.serviceName}</Text>
          <View style={s.itemBottom}>
            <Text
              style={[s.lastMsg, unread > 0 && s.lastMsgBold]}
              numberOfLines={1}
            >
              {lastMsg ? lastMsg.content : `${STATUS_LABELS[item.status] ?? item.status}`}
            </Text>
            {unread > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Chats</Text>
          <Text style={s.subtitle}>
            {bookings.filter(b => b.status !== 'CANCELLED').length} conversaciones activas
            {totalUnread > 0 ? ` · ${totalUnread} nuevos` : ''}
          </Text>
        </View>
        <View style={s.liveIndicator} />
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar conversación..."
          placeholderTextColor="#9ca3af"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={s.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#6c63ff" />
          <Text style={s.loadingText}>Cargando conversaciones...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.centered}>
          <Text style={s.emptyIcon}>{search ? '🔍' : '💬'}</Text>
          <Text style={s.emptyTitle}>
            {search ? 'Sin resultados' : 'Sin conversaciones aún'}
          </Text>
          <Text style={s.emptySubtitle}>
            {search
              ? 'Prueba con otro término'
              : 'Los chats aparecerán aquí cuando tengas reservas activas'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadBookings(true)} />
          }
          ItemSeparatorComponent={() => <View style={s.separator} />}
        />
      )}

      {/* Footer hint */}
      <View style={s.footer}>
        <Text style={s.footerText}>💬 Actualización manual con pull-to-refresh</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  liveIndicator: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981',
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 12, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#e5e7eb', elevation: 1,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1, fontSize: 14, color: '#1f2937',
  },
  clearSearch: { fontSize: 14, color: '#9ca3af', padding: 2 },
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    gap: 8, paddingVertical: 60,
  },
  loadingText: { fontSize: 14, color: '#6b7280' },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  emptySubtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center', paddingHorizontal: 32 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
  },
  itemUnread: { backgroundColor: '#f5f3ff' },
  avatarWrap: { position: 'relative' },
  statusDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: '#fff',
  },
  itemContent: { flex: 1, gap: 3 },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  otherName: { fontSize: 15, fontWeight: '600', color: '#1f2937', flex: 1 },
  otherNameBold: { fontWeight: '800' },
  timeText: { fontSize: 11, color: '#9ca3af', flexShrink: 0 },
  svcName: { fontSize: 12, color: '#6c63ff', fontWeight: '500' },
  itemBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lastMsg: { fontSize: 13, color: '#6b7280', flex: 1 },
  lastMsgBold: { color: '#1f2937', fontWeight: '600' },
  badge: {
    backgroundColor: '#6c63ff', borderRadius: 10,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5, flexShrink: 0,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  separator: { height: 1, backgroundColor: '#f3f4f6' },
  footer: {
    paddingVertical: 10, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff',
  },
  footerText: { fontSize: 11, color: '#9ca3af', textAlign: 'center' },
});
