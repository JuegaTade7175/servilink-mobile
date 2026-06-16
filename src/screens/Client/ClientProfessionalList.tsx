import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, Avatar, Button, ActivityIndicator, Searchbar } from 'react-native-paper';
import { professionalsApi } from '../../api';
import { Professional } from '../../types';

export default function ClientProfessionalList() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchProfessionals = async () => {
    try {
      // Coordenadas de prueba (Lima)
      const data = await professionalsApi.nearby(-12.0464, -77.0428, 50);
      setProfessionals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

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
        <Button onPress={() => {}}>Ver Perfil</Button>
        <Button mode="contained" onPress={() => {}}>Reservar</Button>
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
