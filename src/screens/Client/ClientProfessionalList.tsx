import React, { useState, useCallback, useEffect } from 'react';
import {
  View, StyleSheet, FlatList, RefreshControl,
  Text, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Avatar, Card, Paragraph, Searchbar } from 'react-native-paper';
import * as Location from 'expo-location';
import { professionalsApi, mapApi } from '../../api';
import type { Professional, Booking } from '../../types';
import AvailabilityScreen from '../Shared/AvailabilityScreen';
import BookingWizard from '../Shared/BookingWizard';
import BookingDetailScreen from '../Shared/BookingDetailScreen';
import ProfessionalDetail from '../Shared/ProfessionalDetail';

const LIMA_FALLBACK = {
  latitude: -12.0464,
  longitude: -77.0428,
  label: 'Usando Lima como referencia. Activa permisos de ubicación para ver resultados cercanos.',
};

export default function ClientProfessionalList() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  // Sub-screen state
  const [viewingAvail, setViewingAvail] = useState<{ id: number; name: string } | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardPro, setWizardPro] = useState<Professional | null>(null);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [selectedProId, setSelectedProId] = useState<number | null>(null);

  const resolveLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setLocationMessage(LIMA_FALLBACK.label);
        return LIMA_FALLBACK;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocationMessage(null);
      return { latitude: current.coords.latitude, longitude: current.coords.longitude };
    } catch {
      setLocationMessage(LIMA_FALLBACK.label);
      return LIMA_FALLBACK;
    }
  };

  const fetchProfessionals = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const loc = await resolveLocation();
      const data = await professionalsApi.nearby(loc.latitude, loc.longitude, 50);
      // Try to enrich with geo points (distance) from mapApi
      try {
        const gp = await mapApi.geoPoints(loc.latitude, loc.longitude, 50);
        const byId = new Map(gp.map(x => [x.professionalId, x] as [number, any]));
        const enriched = data.map(d => {
          const g = byId.get(d.id);
          return { ...d, distanceKm: d.distanceKm ?? g?.distanceKm ?? d.distanceKm };
        });
        setProfessionals(enriched);
      } catch {
        setProfessionals(data);
      }
    } catch {
      try {
        const data = await professionalsApi.nearby(LIMA_FALLBACK.latitude, LIMA_FALLBACK.longitude, 50);
        setProfessionals(data);
      } catch { }
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchProfessionals(); }, [fetchProfessionals]);

  const filtered = professionals.filter(p =>
    p.userName.toLowerCase().includes(search.toLowerCase()) ||
    p.specialty.toLowerCase().includes(search.toLowerCase())
  );

  // Sub-screens
  if (viewingAvail) {
    return (
      <AvailabilityScreen
        professionalId={viewingAvail.id}
        professionalName={viewingAvail.name}
        isOwner={false}
        onBack={() => setViewingAvail(null)}
      />
    );
  }

  if (createdBooking) {
    return (
      <BookingDetailScreen
        booking={createdBooking}
        onBack={() => setCreatedBooking(null)}
        onUpdated={updated => setCreatedBooking(updated)}
      />
    );
  }

  const handleReservar = (pro: Professional) => {
    setWizardPro(pro);
    setShowWizard(true);
  };

  const renderItem = ({ item }: { item: Professional }) => (
    <Card style={s.card} elevation={3} onPress={() => setSelectedProId(item.id)}>
      <Card.Title
        title={item.userName}
        subtitle={item.specialty}
        left={props => <Avatar.Text {...props} label={item.userName.slice(0, 2).toUpperCase()} />}
        right={() =>
          item.isVerified
            ? <Text style={s.verified}>✓ Verificado</Text>
            : null
        }
      />
      <Card.Content>
        <Paragraph numberOfLines={2} style={s.desc}>
          {item.description || 'Sin descripción'}
        </Paragraph>
        <View style={s.metaRow}>
          <Text style={s.price}>S/. {item.baseRate}/hr</Text>
          <Text style={s.rating}>★ {(item.averageRating ?? 0).toFixed(1)} ({item.totalReviews})</Text>
          {item.distanceKm != null && (
            <Text style={s.dist}>📍 {item.distanceKm.toFixed(1)} km</Text>
          )}
        </View>
        {item.services.length > 0 && (
          <View style={s.tagsRow}>
            {item.services.slice(0, 3).map(sv => (
              <View key={sv.id} style={s.tag}>
                <Text style={s.tagText}>{sv.name}</Text>
              </View>
            ))}
          </View>
        )}
      </Card.Content>
      <Card.Actions style={s.actions}>
        <TouchableOpacity
          style={s.availBtn}
          onPress={() => setViewingAvail({ id: item.id, name: item.userName })}
        >
          <Text style={s.availLabel}>📅 Ver horarios</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.reservarBtn}
          onPress={() => handleReservar(item)}
        >
          <Text style={s.reservarLabel}>＋ Reservar</Text>
        </TouchableOpacity>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={s.container}>
      <Searchbar
        placeholder="Buscar especialidad o nombre"
        onChangeText={setSearch}
        value={search}
        style={s.searchbar}
        inputStyle={{ fontSize: 14 }}
      />
      {locationMessage && <Text style={s.locationMsg}>{locationMessage}</Text>}

      {loading && !refreshing ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#6c63ff" />
          <Text style={s.loadingText}>Buscando profesionales...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProfessionals(true)} />}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.centered}>
              <Text style={s.emptyIcon}>🔍</Text>
              <Text style={s.emptyText}>No se encontraron profesionales</Text>
            </View>
          }
        />
      )}

      {/* Booking wizard — pre-selects the professional */}
      <BookingWizard
        visible={showWizard}
        onClose={() => { setShowWizard(false); setWizardPro(null); }}
        onCreated={b => {
          setShowWizard(false);
          setWizardPro(null);
          setCreatedBooking(b);
        }}
        initialProfessional={wizardPro ?? undefined}
      />
      {selectedProId && (
        <ProfessionalDetail professionalId={selectedProId} visible={true} onClose={() => setSelectedProId(null)} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchbar: { margin: 12, elevation: 2, borderRadius: 12 },
  locationMsg: { marginHorizontal: 16, marginBottom: 8, color: '#6b7280', fontSize: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 14 },
  card: { borderRadius: 14, backgroundColor: '#fff' },
  desc: { color: '#6b7280', fontSize: 13, marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 8 },
  price: { fontWeight: '700', color: '#6c63ff', fontSize: 14 },
  rating: { color: '#f59e0b', fontSize: 13 },
  dist: { color: '#6b7280', fontSize: 12 },
  verified: { color: '#10b981', fontWeight: '700', fontSize: 12, marginRight: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: '#f3f4f6', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  tagText: { fontSize: 11, color: '#6b7280' },
  actions: { gap: 8, paddingHorizontal: 8, paddingBottom: 8 },
  availBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: '#6c63ff', alignItems: 'center',
  },
  availLabel: { color: '#6c63ff', fontSize: 12, fontWeight: '600' },
  reservarBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#6c63ff', alignItems: 'center',
  },
  reservarLabel: { color: '#fff', fontSize: 12, fontWeight: '700' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, gap: 10 },
  loadingText: { color: '#6b7280', fontSize: 14 },
  emptyIcon: { fontSize: 44 },
  emptyText: { fontSize: 14, color: '#6b7280' },
});
