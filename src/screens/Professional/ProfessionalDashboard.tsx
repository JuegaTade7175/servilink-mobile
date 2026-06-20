import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomNavigation } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { professionalsApi, notificationsApi } from '../../api';
import type { Professional } from '../../types';
import ProfessionalProfile from './ProfessionalProfile';
import ProfessionalBookings from './ProfessionalBookings';
import ProfessionalOnboardingScreen from './ProfessionalOnboardingScreen';
import AvailabilityScreen from '../Shared/AvailabilityScreen';
import NotificationsScreen from '../Shared/NotificationsScreen';

// ─── Rutas declaradas FUERA del componente para evitar re-creación ───────────
const ROUTES = [
  {
    key: 'bookings',
    title: 'Reservas',
    focusedIcon: 'calendar-check',
    unfocusedIcon: 'calendar-blank',
  },
  {
    key: 'availability',
    title: 'Horarios',
    focusedIcon: 'clock-outline',
    unfocusedIcon: 'clock-outline',
  },
  {
    key: 'profile',
    title: 'Perfil',
    focusedIcon: 'account',
    unfocusedIcon: 'account-outline',
  },
];

export default function ProfessionalDashboard() {
  const { role } = useAuth();

  // ─── Todos los hooks ANTES de cualquier return condicional ───────────────
  const [index, setIndex] = useState(0);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loadingProf, setLoadingProf] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Carga el perfil profesional
  useEffect(() => {
    if (role !== 'PROFESSIONAL') {
      setNeedsOnboarding(false);
      setLoadingProf(false);
      return;
    }
    professionalsApi
      .me()
      .then((p) => {
        setProfessional(p);
        setNeedsOnboarding(false);
      })
      .catch(() => setNeedsOnboarding(true))
      .finally(() => setLoadingProf(false));
  }, [role]);

  // Polling de notificaciones no leídas (cada 30s)
  const fetchUnread = useCallback(async () => {
    try {
      const data = await notificationsApi.unreadCount();
      setUnreadCount(data.unreadCount);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, 30_000);
    return () => clearInterval(id);
  }, [fetchUnread]);

  // ─── Returns condicionales DESPUÉS de todos los hooks ───────────────────
  if (loadingProf) {
    return (
      <View style={s.centered}>
        <Text style={s.loadingText}>Verificando perfil...</Text>
      </View>
    );
  }

  if (needsOnboarding) {
    return (
      <ProfessionalOnboardingScreen
        onCompleted={() => {
          setNeedsOnboarding(false);
          professionalsApi.me().then(setProfessional).catch(() => {});
        }}
      />
    );
  }

  if (showNotifs) {
    return (
      <NotificationsScreen
        onBack={() => {
          setShowNotifs(false);
          fetchUnread(); // refresca el badge al volver
        }}
      />
    );
  }

  // ─── Render de escenas ───────────────────────────────────────────────────
  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'bookings':
        return professional ? (
          <ProfessionalBookings professionalId={professional.id} />
        ) : (
          <View style={s.centered}>
            <Text>Crea tu perfil profesional primero.</Text>
          </View>
        );

      case 'availability':
        return professional ? (
          <AvailabilityScreen
            professionalId={professional.id}
            isOwner
            onBack={() => setIndex(0)}
          />
        ) : (
          <View style={s.centered}>
            <Text>Crea tu perfil profesional primero.</Text>
          </View>
        );

      case 'profile':
        return (
          <ProfessionalProfile
            onShowNotifs={() => setShowNotifs(true)}
            unreadCount={unreadCount}
          />
        );

      default:
        return null;
    }
  };

  // Badge de notificaciones sobre el tab de perfil
  const renderBadge = ({ route }: { route: { key: string } }) => {
    if (route.key === 'profile' && unreadCount > 0) {
      return (
        <View style={s.badge}>
          <Text style={s.badgeText}>
            {unreadCount > 9 ? '9+' : String(unreadCount)}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <BottomNavigation
      navigationState={{ index, routes: ROUTES }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      renderBadge={renderBadge}
      barStyle={s.bar}
    />
  );
}

const s = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#6b7280', fontSize: 15 },
  bar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
});
