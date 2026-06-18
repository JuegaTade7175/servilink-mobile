import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { professionalsApi, usersApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import type { Professional } from '../../types';

interface Props {
  onShowNotifs?: () => void;
}

export default function ProfessionalProfile({ onShowNotifs }: Props) {
  const { logout, userName } = useAuth();
  const [profile, setProfile] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoSaving, setPhotoSaving] = useState(false);
  const [form, setForm] = useState({
    specialty: '',
    description: '',
    baseRate: '',
    coverageRadiusKm: '',
    certifications: '',
  });
  const [errors, setErrors] = useState({ specialty: '', baseRate: '', coverageRadiusKm: '' });

  useEffect(() => {
    professionalsApi.me()
      .then(p => {
        setProfile(p);
        setForm({
          specialty: p.specialty || '',
          description: p.description || '',
          baseRate: String(p.baseRate || ''),
          coverageRadiusKm: String(p.coverageRadiusKm || ''),
          certifications: p.certifications || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const validate = () => {
    const baseRate = Number(form.baseRate);
    const coverageRadiusKm = Number(form.coverageRadiusKm);
    const next = {
      specialty:        form.specialty.trim() ? '' : 'Ingresa una especialidad.',
      baseRate:         (Number.isFinite(baseRate) && baseRate > 0) ? '' : 'Tarifa inválida.',
      coverageRadiusKm: (Number.isFinite(coverageRadiusKm) && coverageRadiusKm > 0) ? '' : 'Radio inválido.',
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const updated = await professionalsApi.updateProfile({
        specialty: form.specialty.trim(),
        description: form.description.trim() || undefined,
        baseRate: Number(form.baseRate),
        coverageRadiusKm: Number(form.coverageRadiusKm),
        certifications: form.certifications.trim() || undefined,
      });
      setProfile(updated);
      setEditing(false);
      Alert.alert('✓', 'Perfil actualizado');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    }
    setSaving(false);
  };

  const savePhoto = async () => {
    if (!photoUrl.startsWith('https://')) {
      Alert.alert('Error', 'La URL debe comenzar con https://');
      return;
    }
    setPhotoSaving(true);
    try {
      await usersApi.updatePhoto(photoUrl);
      setPhotoUrl('');
      Alert.alert('✓', 'Foto actualizada');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Error');
    }
    setPhotoSaving(false);
  };

  if (loading) {
    return <View style={s.centered}><ActivityIndicator size="large" color="#6c63ff" /></View>;
  }

  const COLORS = ['#6c63ff','#ec4899','#14b8a6','#f59e0b','#8b5cf6'];
  const name = profile?.userName ?? userName ?? 'P';
  const avatarColor = COLORS[name.charCodeAt(0) % COLORS.length];
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      {/* Notification shortcut */}
      {onShowNotifs && (
        <TouchableOpacity style={s.notifBtn} onPress={onShowNotifs}>
          <Text style={s.notifIcon}>🔔</Text>
          <Text style={s.notifLabel}>Notificaciones</Text>
          <Text style={s.notifChevron}>›</Text>
        </TouchableOpacity>
      )}

      {/* Avatar */}
      <View style={s.avatarSection}>
        <View style={[s.avatarCircle, { backgroundColor: avatarColor }]}>
          <Text style={s.avatarInitials}>{initials}</Text>
        </View>
        <Text style={s.nameText}>{name}</Text>
        <Text style={s.emailText}>{profile?.userEmail}</Text>
        {profile?.isVerified && (
          <View style={s.verifiedBadge}>
            <Text style={s.verifiedText}>✓ Verificado</Text>
          </View>
        )}
      </View>

      {/* Stats row */}
      {profile && (
        <View style={s.statsRow}>
          <StatBox label="Rating" value={`★ ${(profile.averageRating ?? 0).toFixed(1)}`} />
          <StatBox label="Reseñas" value={String(profile.totalReviews ?? 0)} />
          <StatBox label="Tarifa/hr" value={`S/. ${profile.baseRate}`} />
        </View>
      )}

      {/* Profile card */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Perfil Profesional</Text>
          {!editing && (
            <TouchableOpacity style={s.editBtn} onPress={() => setEditing(true)}>
              <Text style={s.editBtnText}>✏️ Editar</Text>
            </TouchableOpacity>
          )}
        </View>

        {!editing ? (
          <View style={s.infoGrid}>
            <InfoField label="Especialidad"    value={profile?.specialty || '—'} />
            <InfoField label="Tarifa base/hr"  value={profile?.baseRate != null ? `S/. ${profile.baseRate}` : '—'} />
            <InfoField label="Radio cobertura" value={profile?.coverageRadiusKm != null ? `${profile.coverageRadiusKm} km` : '—'} />
            <InfoField label="Certificaciones" value={profile?.certifications || '—'} />
            <InfoField label="Descripción"     value={profile?.description || '—'} wide />
            <InfoField label="Latitud"         value={profile?.latitude != null ? String(profile.latitude) : '—'} />
            <InfoField label="Longitud"        value={profile?.longitude != null ? String(profile.longitude) : '—'} />
          </View>
        ) : (
          <View style={s.editForm}>
            <FormField
              label="ESPECIALIDAD *"
              value={form.specialty}
              onChangeText={v => { setForm(f => ({...f, specialty: v})); setErrors(e => ({...e, specialty: ''})); }}
              error={errors.specialty}
            />
            <FormField
              label="DESCRIPCIÓN"
              value={form.description}
              onChangeText={v => setForm(f => ({...f, description: v}))}
              multiline
            />
            <FormField
              label="TARIFA BASE/HR (S/.) *"
              value={form.baseRate}
              onChangeText={v => { setForm(f => ({...f, baseRate: v})); setErrors(e => ({...e, baseRate: ''})); }}
              keyboardType="decimal-pad"
              error={errors.baseRate}
            />
            <FormField
              label="RADIO DE COBERTURA (KM) *"
              value={form.coverageRadiusKm}
              onChangeText={v => { setForm(f => ({...f, coverageRadiusKm: v})); setErrors(e => ({...e, coverageRadiusKm: ''})); }}
              keyboardType="decimal-pad"
              error={errors.coverageRadiusKm}
            />
            <FormField
              label="CERTIFICACIONES"
              value={form.certifications}
              onChangeText={v => setForm(f => ({...f, certifications: v}))}
            />
            <View style={s.editActions}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => { setErrors({specialty:'',baseRate:'',coverageRadiusKm:''}); setEditing(false); }}
              >
                <Text style={s.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Photo URL */}
      <View style={s.card}>
        <Text style={s.cardTitle}>📸 Foto de perfil</Text>
        <Text style={s.photoHint}>Sube tu foto a Cloudinary o Imgur y pega la URL (https://…)</Text>
        <TextInput
          style={s.urlInput}
          value={photoUrl}
          onChangeText={setPhotoUrl}
          placeholder="https://res.cloudinary.com/..."
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          keyboardType="url"
        />
        <TouchableOpacity
          style={[s.saveBtn, (!photoUrl || photoSaving) && s.saveBtnDisabled]}
          onPress={savePhoto}
          disabled={!photoUrl || photoSaving}
        >
          {photoSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnText}>Guardar foto</Text>}
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={logout}>
        <Text style={s.logoutText}>🚪 Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={sb.box}>
      <Text style={sb.value}>{value}</Text>
      <Text style={sb.label}>{label}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  box: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb',
  },
  value: { fontSize: 17, fontWeight: '800', color: '#6c63ff' },
  label: { fontSize: 11, color: '#6b7280', marginTop: 3 },
});

function InfoField({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={[inf.field, wide && inf.fieldWide]}>
      <Text style={inf.label}>{label}</Text>
      <Text style={inf.value}>{value}</Text>
    </View>
  );
}
const inf = StyleSheet.create({
  field: { width: '48%' },
  fieldWide: { width: '100%' },
  label: { fontSize: 10, color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase', marginBottom: 3 },
  value: { fontSize: 14, color: '#1f2937' },
});

function FormField({
  label, value, onChangeText, error, multiline, keyboardType,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  error?: string; multiline?: boolean; keyboardType?: any;
}) {
  return (
    <View style={ff.wrapper}>
      <Text style={ff.label}>{label}</Text>
      <TextInput
        style={[ff.input, multiline && ff.inputMulti, error ? ff.inputError : null]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        placeholderTextColor="#9ca3af"
      />
      {error ? <Text style={ff.error}>{error}</Text> : null}
    </View>
  );
}
const ff = StyleSheet.create({
  wrapper: { gap: 4 },
  label: { fontSize: 10, fontWeight: '700', color: '#6b7280', letterSpacing: 1 },
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: '#1f2937',
  },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  inputError: { borderColor: '#ef4444' },
  error: { fontSize: 12, color: '#ef4444' },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16, gap: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notifBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: '#e5e7eb', gap: 10,
  },
  notifIcon: { fontSize: 20 },
  notifLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1f2937' },
  notifChevron: { fontSize: 20, color: '#9ca3af' },
  avatarSection: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  avatarCircle: {
    width: 84, height: 84, borderRadius: 42,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(108,99,255,0.3)',
  },
  avatarInitials: { color: '#fff', fontWeight: '800', fontSize: 28 },
  nameText: { fontSize: 20, fontWeight: '800', color: '#1f2937', marginTop: 4 },
  emailText: { fontSize: 13, color: '#6b7280' },
  verifiedBadge: {
    backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#6ee7b7', marginTop: 4,
  },
  verifiedText: { fontSize: 12, color: '#059669', fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: '#e5e7eb', elevation: 1, gap: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  editBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#f3f4f6', borderRadius: 8,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  editBtnText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  editForm: { gap: 14 },
  editActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  saveBtn: {
    flex: 1, backgroundColor: '#6c63ff', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  photoHint: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  urlInput: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 13, color: '#1f2937',
  },
  logoutBtn: {
    backgroundColor: '#fee2e2', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#fca5a5', marginBottom: 20,
  },
  logoutText: { color: '#b91c1c', fontWeight: '700', fontSize: 15 },
});
