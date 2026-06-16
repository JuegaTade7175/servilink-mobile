import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Title, Button, TextInput, Avatar, Card, ActivityIndicator, HelperText } from 'react-native-paper';
import { professionalsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Professional } from '../../types';

export default function ProfessionalProfile() {
  const { logout, userName } = useAuth();
  const [profile, setProfile] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    specialty: '',
    description: '',
    baseRate: '',
    coverageRadiusKm: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const p = await professionalsApi.me();
      setProfile(p);
      setForm({
        specialty: p.specialty || '',
        description: p.description || '',
        baseRate: String(p.baseRate || ''),
        coverageRadiusKm: String(p.coverageRadiusKm || ''),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updated = await professionalsApi.updateProfile({
        specialty: form.specialty,
        description: form.description,
        baseRate: Number(form.baseRate),
        coverageRadiusKm: Number(form.coverageRadiusKm),
      });
      setProfile(updated);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar.Text size={80} label={userName?.[0] || 'P'} />
        <Title style={styles.title}>{userName}</Title>
        <Text style={styles.email}>{profile?.userEmail}</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          {!editing ? (
            <View>
              <View style={styles.field}>
                <Text style={styles.label}>Especialidad</Text>
                <Text style={styles.value}>{profile?.specialty || 'No especificado'}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Tarifa Base</Text>
                <Text style={styles.value}>S/ {profile?.baseRate || '0.00'}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Descripción</Text>
                <Text style={styles.value}>{profile?.description || 'Sin descripción'}</Text>
              </View>
              <Button mode="outlined" onPress={() => setEditing(true)} style={styles.button}>
                Editar Perfil
              </Button>
            </View>
          ) : (
            <View>
              <TextInput
                label="Especialidad"
                value={form.specialty}
                onChangeText={v => setForm(f => ({ ...f, specialty: v }))}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Tarifa Base (S/)"
                value={form.baseRate}
                onChangeText={v => setForm(f => ({ ...f, baseRate: v }))}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />
              <TextInput
                label="Descripción"
                value={form.description}
                onChangeText={v => setForm(f => ({ ...f, description: v }))}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
              <View style={styles.row}>
                <Button mode="contained" onPress={handleSave} style={[styles.button, { flex: 1, marginRight: 8 }]}>
                  Guardar
                </Button>
                <Button mode="outlined" onPress={() => setEditing(false)} style={[styles.button, { flex: 1 }]}>
                  Cancelar
                </Button>
              </View>
            </View>
          )}
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
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 10,
  },
  logout: {
    marginTop: 10,
    marginBottom: 30,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
});
