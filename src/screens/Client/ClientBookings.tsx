import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { bookingsApi } from '../../api';
import type { Booking, BookingStatus } from '../../types';
import BookingDetailScreen from '../Shared/BookingDetailScreen';
import BookingWizard from '../Shared/BookingWizard';
import ChatScreen from '../Shared/ChatScreen';

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: 'Pendiente', bg: '#fef3c7', text: '#92400e' },
  CONFIRMED: { label: 'Confirmada', bg: '#ede9fe', text: '#5b21b6' },
  IN_PROGRESS: { label: 'En progreso', bg: '#dbeafe', text: '#1e40af' },
  COMPLETED: { label: 'Completada', bg: '#ecfdf5', text: '#065f46' },
  CANCELLED: { label: 'Cancelada', bg: '#fee2e2', text: '#991b1b' },
};

const FILTERS: { value: BookingStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'COMPLETED', label: 'Completadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function ClientBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const data = await bookingsApi.myBookings();
      setBookings(data.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch { }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);

  const handleUpdated = (updated: Booking) => {
    setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
    setSelected(updated);
  };
  const handleCreated = (b: Booking) => {
    setBookings(prev => [b, ...prev]);
    setSelected(b);
  };

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
            <Text style={s.svcName} numberOfLines={1}>{item.serviceName}</Text>
            <Text style={s.profName}>con {item.professionalName}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[s.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
        </View>
        <View style={s.cardBottom}>
          <Text style={s.meta}>📅 {fmtDate(item.scheduledAt)}</Text>
          <Text style={s.meta} numberOfLines={1}>📍 {item.address.slice(0, 28)}{item.address.length > 28 ? '…' : ''}</Text>
        </View>
        { }
        {item.status !== 'CANCELLED' && (
          <TouchableOpacity
            style={s.chatBtn}
            onPress={() => setChatBooking(item)}
          >
            <Text style={s.chatBtnText}>💬 Chat</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      { }
      <View style={s.header}>
        <View>
          <Text style={s.title}>Mis Reservas</Text>
          <Text style={s.subtitle}>{bookings.length} en total</Text>
        </View>
        <TouchableOpacity style={s.newBtn} onPress={() => setShowWizard(true)}>
          <Text style={s.newBtnText}>＋ Nueva</Text>
        </TouchableOpacity>
      </View>

      { }
      <View>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={f => f.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
          renderItem={({ item: f }) => {
            const count = f.value === 'ALL'
              ? bookings.length
              : bookings.filter(b => b.status === f.value).length;
            return (
              <TouchableOpacity
                style={[s.filterChip, filter === f.value && s.filterChipActive]}
                onPress={() => setFilter(f.value)}
              >
                <Text style={[s.filterText, filter === f.value && s.filterTextActive]}>
                  {f.label}{count > 0 ? ` (${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

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
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyTitle}>
                {filter === 'ALL' ? 'Sin reservas aún' : 'Sin resultados'}
              </Text>
              {filter === 'ALL' && (
                <TouchableOpacity style={s.newBtn2} onPress={() => setShowWizard(true)}>
                  <Text style={s.newBtnText}>＋ Crear reserva</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <BookingWizard
        visible={showWizard}
        onClose={() => setShowWizard(false)}
        onCreated={handleCreated}
      />
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
  newBtn: { backgroundColor: '#6c63ff', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  newBtn2: { marginTop: 12, backgroundColor: '#6c63ff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#fff' },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  filterChipActive: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 60 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 15, color: '#6b7280' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#e5e7eb', elevation: 2, gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  svcName: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  profName: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardBottom: { gap: 4 },
  meta: { fontSize: 12, color: '#6b7280' },
  chatBtn: {
    alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: '#ede9fe', borderRadius: 8, borderWidth: 1, borderColor: '#c4b5fd',
  },
  chatBtnText: { fontSize: 12, color: '#6c63ff', fontWeight: '600' },
});
