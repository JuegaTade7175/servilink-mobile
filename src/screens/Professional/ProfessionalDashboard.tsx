import React, { useState } from 'react';
import { BottomNavigation } from 'react-native-paper';
import ProfessionalBookings from './ProfessionalBookings';
import ProfessionalProfile from './ProfessionalProfile';
import { useAuth } from '../../context/AuthContext';

const BookingsRoute = () => <ProfessionalBookings />;
const ProfileRoute = () => <ProfessionalProfile />;

export default function ProfessionalDashboard() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'bookings', title: 'Reservas', focusedIcon: 'calendar-check', unfocusedIcon: 'calendar-blank' },
    { key: 'profile', title: 'Perfil', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    bookings: BookingsRoute,
    profile: ProfileRoute,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      barStyle={{ backgroundColor: '#fff' }}
    />
  );
}
