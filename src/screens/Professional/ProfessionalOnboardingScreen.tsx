import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { professionalsApi } from '../../api';

interface Props {
  onCompleted: () => void;
}

export default function ProfessionalOnboardingScreen({ onCompleted }: Props) {
  const [specialty, setSpecialty] = useState('');
  const [description, setDescription] = useState('');
  const [baseRate, setBaseRate] = useState('');
  const [coverage, setCoverage] = useState('10');
  const [certifications, setCertifications] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se pudo acceder a tu ubicación.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLat(String(pos.coords.latitude));
      setLng(String(pos.coords.longitude));
    } catch {
      Alert.alert('Error', 'No se pudo obtener tu ubicación');
    }
    setLocating(false);
  };

  const submit = async () => {
    if (!specialty.trim()) { Alert.alert('Error', 'La especialidad es obligatoria'); return; }
    if (!baseRate || Number(baseRate) <= 0) { Alert.alert('Error', 'Ingresa una tarifa válida'); return; }
    setLoading(true);
    try {
      await professionalsApi.createProfile({
        specialty: specialty.trim(),
        description: description.trim() || undefined,
        baseRate: Number(baseRate),
        coverageRadiusKm: Number(coverage) || 10,
        certifications: certifications.trim() || undefined,
        latitude: lat ? Number(lat) : undefined,
        longitude: lng ? Number(lng) : undefined,
        address: address.trim() || undefined,
      });
      onCompleted();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear el perfil');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.hero}>
          <Text style={s.heroIcon}>🛠️</Text>
          <Text style={s.heroTitle}>Completa tu perfil</Text>
          <Text style={s.heroSub}>Cuéntales a los clientes quién eres y qué haces</Text>
        </View>

        <View style={s.card}>
          <Text style={s.label}>ESPECIALIDAD *</Text>
          <TextInput
            style={s.input}
            value={specialty}
            onChangeText={setSpecialty}
            placeholder="Ej: Electricista Certificado, Gasfitero..."
            placeholderTextColor="#9ca3af"
          />

          <Text style={[s.label, { marginTop: 16 }]}>DESCRIPCIÓN</Text>
          <TextInput
            style={[s.input, s.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Cuéntale a los clientes tu experiencia..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
          />

          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>TARIFA/HR (S/.) *</Text>
              <TextInput
                style={s.input}
                value={baseRate}
                onChangeText={setBaseRate}
                placeholder="50.00"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>RADIO (KM)</Text>
              <TextInput
                style={s.input}
                value={coverage}
                onChangeText={setCoverage}
                keyboardType="decimal-pad"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <Text style={[s.label, { marginTop: 16 }]}>CERTIFICACIONES</Text>
          <TextInput
            style={s.input}
            value={certifications}
            onChangeText={setCertifications}
            placeholder="Ej: Certificado SENATI 2022"
            placeholderTextColor="#9ca3af"
          />

          <View style={s.locationHeader}>
            <Text style={s.label}>UBICACIÓN</Text>
            <TouchableOpacity onPress={useMyLocation} disabled={locating}>
              {locating
                ? <ActivityIndicator size="small" color="#6c63ff" />
                : <Text style={s.locBtn}>📍 Usar mi ubicación</Text>}
            </TouchableOpacity>
          </View>

          <TextInput
            style={[s.input, { marginBottom: 8 }]}
            value={address}
            onChangeText={setAddress}
            placeholder="Dirección (opcional)"
            placeholderTextColor="#9ca3af"
          />

          {lat && lng && (
            <Text style={s.locOk}>
              ✓ {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[s.submitBtn, loading && s.submitBtnDisabled]}
          onPress={submit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.submitText}>🚀 Crear mi perfil profesional</Text>}
        </TouchableOpacity>

        <Text style={s.hint}>
          Podrás editar estos datos en cualquier momento desde tu dashboard
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 20 },
  hero: { alignItems: 'center', marginBottom: 24, marginTop: 12 },
  heroIcon: { fontSize: 52 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#1f2937', marginTop: 10 },
  heroSub: { fontSize: 14, color: '#6b7280', marginTop: 6, textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#e5e7eb', elevation: 2, marginBottom: 20,
  },
  label: { fontSize: 10, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginBottom: 6 },
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1f2937',
  },
  multiline: { height: 80, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', gap: 12, marginTop: 16 },
  locationHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 16, marginBottom: 6,
  },
  locBtn: { fontSize: 12, color: '#6c63ff', fontWeight: '600' },
  locOk: { fontSize: 12, color: '#10b981', marginTop: 6 },
  submitBtn: {
    backgroundColor: '#6c63ff', paddingVertical: 16,
    borderRadius: 14, alignItems: 'center', marginBottom: 12,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginBottom: 20 },
});
