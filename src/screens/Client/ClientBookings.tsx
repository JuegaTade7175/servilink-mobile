import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, Chip, ActivityIndicator } from 'react-native-paper';
import { bookingsApi } from '../../api';
import { Booking } from '../../types';

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: '#f1c40f' },
  CONFIRMED: { label: 'Confirmada', color: '#2ecc71' },
  IN_PROGRESS: { label: 'En progreso', color: '#3498db' },
  COMPLETED: { label: 'Completada', color: '#9b59b6' },
  CANCELLED: { label: 'Cancelada', color: '#e74c3c' },
};

export default function ClientBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const data = await bookingsApi.myBookings();
      setBookings(data.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const renderItem = ({ item }: { item: Booking }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Title style={styles.profName}>{item.professionalName}</Title>
          <Chip 
            textStyle={{ color: '#fff' }} 
            style={{ backgroundColor: STATUS_CFG[item.status]?.color || '#ccc' }}
          >
            {STATUS_CFG[item.status]?.label || item.status}
          </Chip>
        </View>
        <Paragraph>{item.serviceName}</Paragraph>
        <Text style={styles.date}>
          📅 {new Date(item.scheduledAt).toLocaleDateString('es-PE', {
            weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
          })}
        </Text>
        <Text style={styles.address}>📍 {item.address}</Text>
      </Card.Content>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>Aún no has realizado ninguna reserva</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  date: {
    marginTop: 8,
    color: '#666',
  },
  address: {
    marginTop: 4,
    color: '#666',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    marginTop: 50,
  },
});
