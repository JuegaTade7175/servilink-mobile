import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomNavigation } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { professionalsApi } from '../../api';
import type { Professional } from '../../types';
import ProfessionalProfile from './ProfessionalProfile';
import ProfessionalBookings from './ProfessionalBookings';
import ProfessionalOnboardingScreen from './ProfessionalOnboardingScreen';
import AvailabilityScreen from '../Shared/AvailabilityScreen';
import NotificationsScreen from '../Shared/NotificationsScreen';

export default function ProfessionalDashboard() {
  const { role } = useAuth();
  const [index, setIndex] = useState(0);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loadingProf, setLoadingProf] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (role !== 'PROFESSIONAL') { setNeedsOnboarding(false); setLoadingProf(false); return; }
    professionalsApi.me()
      .then(p => { setProfessional(p); setNeedsOnboarding(false); })
      .catch(() => setNeedsOnboarding(true))
      .finally(() => setLoadingProf(false));
  }, [role]);

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

  if (showNotifs) return <NotificationsScreen onBack={() => setShowNotifs(false)} />;

  const [routes] = useState([
    { key: 'bookings',      title: 'Reservas',     focusedIcon: 'calendar-check',  unfocusedIcon: 'calendar-blank' },
    { key: 'availability',  title: 'Horarios',     focusedIcon: 'clock-outline',   unfocusedIcon: 'clock-outline' },
    { key: 'profile',       title: 'Perfil',       focusedIcon: 'account',         unfocusedIcon: 'account-outline' },
  ]);

  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'bookings':
        return professional
          ? <ProfessionalBookings professionalId={professional.id} />
          : <View style={s.centered}><Text>Crea tu perfil profesional primero.</Text></View>;
      case 'availability':
        return professional
          ? <AvailabilityScreen
              professionalId={professional.id}
              isOwner
              onBack={() => setIndex(0)}
            />
          : <View style={s.centered}><Text>Crea tu perfil profesional primero.</Text></View>;
      case 'profile':
        return <ProfessionalProfile onShowNotifs={() => setShowNotifs(true)} />;
      default:
        return null;
    }
  };

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      barStyle={s.bar}
    />
  );
}

const s = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#6b7280', fontSize: 15 },
  bar: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
});
