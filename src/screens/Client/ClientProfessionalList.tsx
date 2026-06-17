import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, Avatar, Button, ActivityIndicator, Searchbar } from 'react-native-paper';
import * as Location from 'expo-location';
import { professionalsApi } from '../../api';
import { Professional } from '../../types';

const LIMA_FALLBACK = {
  latitude: -12.0464,
  longitude: -77.0428,
  label: 'Usando ubicación referencial de Lima. Activa permisos de ubicación para ver resultados cercanos a ti.',
};

export default function ClientProfessionalList() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const resolveLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== Location.PermissionStatus.GRANTED) {
      setLocationMessage(LIMA_FALLBACK.label);
      return LIMA_FALLBACK;
    }

    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    setLocationMessage(null);

    return {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    };
  };

  const fetchProfessionals = useCallback(async () => {
    try {
      const location = await resolveLocation();
      const data = await professionalsApi.nearby(location.latitude, location.longitude, 50);
      setProfessionals(data);
    } catch (err) {
      console.error(err);
      setLocationMessage(LIMA_FALLBACK.label);
      const data = await professionalsApi.nearby(LIMA_FALLBACK.latitude, LIMA_FALLBACK.longitude, 50);
      setProfessionals(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfessionals();
  };

  const filtered = professionals.filter(p => 
    p.userName.toLowerCase().includes(search.toLowerCase()) ||
    p.specialty.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: Professional }) => (
    <Card style={styles.card}>
      <Card.Title
        title={item.userName}
        subtitle={item.specialty}
        left={(props) => <Avatar.Text {...props} label={item.userName[0]} />}
      />
      <Card.Content>
        <Paragraph numberOfLines={2}>{item.description || 'Sin descripción'}</Paragraph>
        <View style={styles.infoRow}>
          <Text style={styles.price}>S/ {item.baseRate}/hr</Text>
          <Text style={styles.rating}>★ {item.averageRating.toFixed(1)} ({item.totalReviews})</Text>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => Alert.alert('Perfil', `Detalle pendiente para ${item.userName}.`)}>
          Ver Perfil
        </Button>
        <Button mode="contained" onPress={() => Alert.alert('Reserva', 'La pantalla de creación de reservas aún no está implementada.')}>
          Reservar
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar especialidad o nombre"
        onChangeText={setSearch}
        value={search}
        style={styles.searchbar}
      />
      {locationMessage ? (
        <Text style={styles.locationMessage}>{locationMessage}</Text>
      ) : null}
      {loading && !refreshing ? (
        <ActivityIndicator size="large" style={styles.centered} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text>No se encontraron profesionales cercanos</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 16,
    elevation: 2,
  },
  locationMessage: {
    marginHorizontal: 16,
    marginBottom: 8,
    color: '#666',
    fontSize: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  price: {
    fontWeight: 'bold',
    color: '#6c63ff',
  },
  rating: {
    color: '#f1c40f',
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
