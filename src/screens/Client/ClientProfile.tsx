import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, Text, Button, Avatar, Card } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

export default function ClientProfile() {
  const { logout, userName, userEmail } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar.Text size={80} label={userName?.[0] || 'C'} />
        <Title style={styles.title}>{userName}</Title>
        <Text style={styles.email}>{userEmail}</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.field}>
            <Text style={styles.label}>Nombre completo</Text>
            <Text style={styles.value}>{userName}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Correo electrónico</Text>
            <Text style={styles.value}>{userEmail}</Text>
          </View>
        </Card.Content>
      </Card>

      <Button mode="contained" onPress={logout} buttonColor="#e74c3c" style={styles.logout}>
        Cerrar Sesión
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: 'bold',
  },
  email: {
    color: '#666',
  },
  card: {
    marginBottom: 20,
    elevation: 2,
  },
  field: {
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  logout: {
    marginTop: 10,
    marginBottom: 30,
  },
});
