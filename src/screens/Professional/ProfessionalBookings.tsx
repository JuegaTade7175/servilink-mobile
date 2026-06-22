import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { bookingsApi } from '../../api';
import type { Booking } from '../../types';
import BookingDetailScreen from '../Shared/BookingDetailScreen';
import ChatScreen from '../Shared/ChatScreen';

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: 'Pendiente', bg: '#fef3c7', text: '#92400e' },
  CONFIRMED: { label: 'Confirmada', bg: '#ede9fe', text: '#5b21b6' },
  IN_PROGRESS: { label: 'En progreso', bg: '#dbeafe', text: '#1e40af' },
  COMPLETED: { label: 'Completada', bg: '#ecfdf5', text: '#065f46' },
  CANCELLED: { label: 'Cancelada', bg: '#fee2e2', text: '#991b1b' },
};

const FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const FILTER_LABELS: Record<string, string> = {
  ALL: 'Todas', PENDING: 'Pendientes', CONFIRMED: 'Confirmadas',
  IN_PROGRESS: 'En progreso', COMPLETED: 'Completadas', CANCELLED: 'Canceladas',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

interface Props { professionalId: number; }

export default function ProfessionalBookings({ professionalId }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const data = await bookingsApi.byProfessional(professionalId);
      setBookings(data.sort((a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
      ));
    } catch { }
    setLoading(false);
    setRefreshing(false);
  }, [professionalId]);

  useEffect(() => { load(); }, [load]);

  const handleUpdated = (updated: Booking) => {
    setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
    setSelected(updated);
  };

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);

  if (chatBooking) return <ChatScreen booking={chatBooking} onBack={() => setChatBooking(null)} />;
  if (selected) return (
    <BookingDetailScreen
      booking={selected}
      onBack={() => setSelected(null)}
      onUpdated={handleUpdated}
    />
  );

  const renderItem = ({ item }: { item: Booking }) => {
    const cfg = STATUS_CFG[item.status] ?? { label: item.status, bg: '#f3f4f6', text: '#6b7280' };
    return (
      <TouchableOpacity style={s.card} onPress={() => setSelected(item)} activeOpacity={0.85}>
        <View style={s.cardTop}>
          <View style={{ flex: 1 }}>
            <View style={s.nameRow}>
              <Text style={s.clientName}>#{item.id} — {item.clientName}</Text>
              <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                <Text style={[s.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
              </View>
            </View>
            <Text style={s.svcName}>{item.serviceName}</Text>
          </View>
        </View>
        <Text style={s.meta}>📅 {fmtDate(item.scheduledAt)}</Text>
        <Text style={s.meta} numberOfLines={1}>📍 {item.address}</Text>
        {item.description ? (
          <Text style={s.desc} numberOfLines={2}>"{item.description}"</Text>
        ) : null}
        {item.status !== 'CANCELLED' && (
          <TouchableOpacity
            style={s.chatBtn}
            onPress={() => setChatBooking(item)}
          >
            <Text style={s.chatBtnText}>💬 Chat con cliente</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Reservas recibidas</Text>
        <Text style={s.subtitle}>{bookings.length} total</Text>
      </View>

      { }
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={f => f}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
        renderItem={({ item: f }) => {
          const count = f === 'ALL'
            ? bookings.length
            : bookings.filter(b => b.status === f).length;
          return (
            <TouchableOpacity
              style={[s.filterChip, filter === f && s.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {FILTER_LABELS[f]} ({count})
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {loading ? (
        <View style={s.centered}><ActivityIndicator size="large" color="#6c63ff" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <View style={s.centered}>
              <Text style={s.emptyIcon}>📭</Text>
              <Text style={s.emptyText}>
                {filter === 'ALL' ? 'Sin reservas aún' : `Sin reservas ${FILTER_LABELS[filter]?.toLowerCase()}`}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#fff' },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  filterChipActive: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 60 },
  emptyIcon: { fontSize: 44 },
  emptyText: { fontSize: 14, color: '#6b7280' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#e5e7eb', elevation: 2, gap: 8,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 2 },
  clientName: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  svcName: { fontSize: 13, color: '#6c63ff', fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  meta: { fontSize: 12, color: '#6b7280' },
  desc: {
    fontSize: 12, color: '#7c3aed', fontStyle: 'italic',
    backgroundColor: '#ede9fe', borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: '#c4b5fd',
  },
  chatBtn: {
    alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: '#ede9fe', borderRadius: 8, borderWidth: 1, borderColor: '#c4b5fd',
  },
  chatBtnText: { fontSize: 12, color: '#6c63ff', fontWeight: '600' },
});
