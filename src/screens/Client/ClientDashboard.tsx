import React, { useState } from 'react';
import { BottomNavigation } from 'react-native-paper';
import ClientProfessionalList from './ClientProfessionalList';
import ClientBookings from './ClientBookings';
import ClientProfile from './ClientProfile';
import ChatListScreen from '../Shared/ChatListScreen';

const ProfessionalsRoute = () => <ClientProfessionalList />;
const BookingsRoute      = () => <ClientBookings />;
const ChatRoute          = () => <ChatListScreen />;
const ProfileRoute       = () => <ClientProfile />;

export default function ClientDashboard() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'professionals', title: 'Buscar',       focusedIcon: 'magnify',         unfocusedIcon: 'magnify' },
    { key: 'bookings',      title: 'Mis Reservas',  focusedIcon: 'calendar-check',  unfocusedIcon: 'calendar-blank' },
    { key: 'chat',          title: 'Chats',         focusedIcon: 'chat',            unfocusedIcon: 'chat-outline' },
    { key: 'profile',       title: 'Perfil',        focusedIcon: 'account',         unfocusedIcon: 'account-outline' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    professionals: ProfessionalsRoute,
    bookings:      BookingsRoute,
    chat:          ChatRoute,
    profile:       ProfileRoute,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      barStyle={{ backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' }}
    />
  );
}
