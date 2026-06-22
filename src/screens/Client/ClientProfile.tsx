import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../api';
import type { User } from '../../types';
import NotificationsScreen from '../Shared/NotificationsScreen';

interface Props {
  unreadNotifs?: number;
}

export default function ClientProfile({ unreadNotifs = 0 }: Props) {
  const { logout, userName, userEmail, userId } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoErr, setPhotoErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    usersApi
      .me()
      .then((u) => setUser(u))
      .catch(() => {
        if (userName && userEmail) {
          setUser({
            id: userId ?? 0,
            name: userName,
            email: userEmail,
            phone: '',
            role: 'CLIENT',
            createdAt: new Date().toISOString(),
          });
        }
      })
      .finally(() => setLoading(false));
  }, [userId, userName, userEmail]);

  const updatePhoto = async () => {
    if (!photoUrl.startsWith('https://')) {
      setPhotoErr('La URL debe comenzar con https://');
      return;
    }
    setSaving(true);
    setPhotoErr('');
    try {
      const updated = await usersApi.updatePhoto(photoUrl);
      setUser(updated);
      setPhotoUrl('');
      Alert.alert('✓', 'Foto actualizada');
    } catch (e: unknown) {
      setPhotoErr(e instanceof Error ? e.message : 'Error');
    }
    setSaving(false);
  };

  const removePhoto = () => {
    Alert.alert('Eliminar foto', '¿Confirmas?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = await usersApi.removePhoto();
            setUser(updated);
          } catch { }
        },
      },
    ]);
  };

  if (showNotifs) {
    return <NotificationsScreen onBack={() => setShowNotifs(false)} />;
  }

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#6c63ff" />
      </View>
    );
  }

  const displayName = user?.name ?? userName ?? 'Usuario';
  const displayEmail = user?.email ?? userEmail ?? '';
  const COLORS = ['#6c63ff', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6'];
  const avatarColor = COLORS[displayName.charCodeAt(0) % COLORS.length];
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      { }
      <TouchableOpacity style={s.notifBtn} onPress={() => setShowNotifs(true)}>
        <Text style={s.notifIcon}>🔔</Text>
        <Text style={s.notifLabel}>Notificaciones</Text>
        {unreadNotifs > 0 && (
          <View style={s.notifBadge}>
            <Text style={s.notifBadgeText}>
              {unreadNotifs > 9 ? '9+' : String(unreadNotifs)}
            </Text>
          </View>
        )}
        <Text style={s.notifChevron}>›</Text>
      </TouchableOpacity>

      { }
      <View style={s.avatarSection}>
        {user?.profilePictureUrl ? (
          <View>
            <Image
              source={{ uri: user.profilePictureUrl }}
              style={s.avatar}
            />
            <TouchableOpacity style={s.removePhotoBtn} onPress={removePhoto}>
              <Text style={s.removePhotoText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[s.avatarFallback, { backgroundColor: avatarColor }]}>
            <Text style={s.avatarInitials}>{initials}</Text>
          </View>
        )}
        <Text style={s.name}>{displayName}</Text>
        <Text style={s.role}>
          {user?.role === 'CLIENT'
            ? 'Cliente'
            : user?.role === 'PROFESSIONAL'
              ? 'Profesional'
              : (user?.role ?? '')}
        </Text>
        {user?.createdAt && (
          <Text style={s.since}>
            Miembro desde{' '}
            {new Date(user.createdAt).toLocaleDateString('es-PE', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        )}
      </View>

      { }
      <View style={s.card}>
        <InfoRow icon="✉️" label="Email" value={displayEmail} />
        <View style={s.separator} />
        <InfoRow icon="📱" label="Teléfono" value={user?.phone || '—'} />
        <View style={s.separator} />
        <InfoRow
          icon="🏷️"
          label="Rol"
          value={user?.role === 'CLIENT' ? 'Cliente' : 'Profesional'}
        />
        <View style={s.separator} />
        <InfoRow icon="🆔" label="ID" value={`#${user?.id}`} />
      </View>

      { }
      <View style={s.card}>
        <Text style={s.cardTitle}>📸 Foto de perfil</Text>
        <Text style={s.cardSubtitle}>
          Sube tu foto a Cloudinary, Imgur o ImgBB y pega la URL (https://…)
        </Text>
        <TextInput
          style={s.urlInput}
          value={photoUrl}
          onChangeText={setPhotoUrl}
          placeholder="https://res.cloudinary.com/..."
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        {photoErr ? <Text style={s.errText}>{photoErr}</Text> : null}
        <TouchableOpacity
          style={[s.saveBtn, (saving || !photoUrl) && s.saveBtnDisabled]}
          onPress={updatePhoto}
          disabled={saving || !photoUrl}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={s.saveBtnText}>Guardar foto</Text>
          )}
        </TouchableOpacity>
      </View>

      { }
      <TouchableOpacity style={s.logoutBtn} onPress={logout}>
        <Text style={s.logoutText}>🚪 Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={ir.row}>
      <Text style={ir.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={ir.label}>{label}</Text>
        <Text style={ir.value}>{value}</Text>
      </View>
    </View>
  );
}

const ir = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  icon: { fontSize: 18, width: 24 },
  label: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  value: { fontSize: 14, color: '#1f2937', fontWeight: '500', marginTop: 1 },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16, gap: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  notifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  notifIcon: { fontSize: 20 },
  notifLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1f2937' },
  notifBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  notifChevron: { fontSize: 20, color: '#9ca3af' },

  avatarSection: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#6c63ff',
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(108,99,255,0.3)',
  },
  avatarInitials: { color: '#fff', fontWeight: '800', fontSize: 30 },
  removePhotoBtn: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    backgroundColor: '#ef4444',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '800', color: '#1f2937', marginTop: 4 },
  role: { fontSize: 14, color: '#6c63ff', fontWeight: '600' },
  since: { fontSize: 12, color: '#9ca3af' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 1,
    gap: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  cardSubtitle: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  separator: { height: 1, backgroundColor: '#f3f4f6' },
  urlInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#1f2937',
  },
  errText: { fontSize: 12, color: '#ef4444' },
  saveBtn: {
    backgroundColor: '#6c63ff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  logoutBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  logoutText: { color: '#b91c1c', fontWeight: '700', fontSize: 15 },
});
