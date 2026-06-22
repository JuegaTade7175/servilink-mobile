import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomNavigation } from 'react-native-paper';
import { notificationsApi, messagesApi } from '../../api';
import ClientProfessionalList from './ClientProfessionalList';
import ClientBookings from './ClientBookings';
import ClientProfile from './ClientProfile';
import ChatListScreen from '../Shared/ChatListScreen';
import MapScreen from '../Shared/MapScreen';

const ProfessionalsRoute = () => <ClientProfessionalList />;
const MapRoute = () => <MapScreen />;
const BookingsRoute = () => <ClientBookings />;
const ChatRoute = () => <ChatListScreen />;

const ProfileRoute = ({
  unreadNotifs,
}: {
  unreadNotifs: number;
}) => <ClientProfile unreadNotifs={unreadNotifs} />;

const ROUTES = [
  {
    key: 'professionals',
    title: 'Buscar',
    focusedIcon: 'magnify',
    unfocusedIcon: 'magnify',
  },
  {
    key: 'map',
    title: 'Mapa',
    focusedIcon: 'map',
    unfocusedIcon: 'map-outline',
  },
  {
    key: 'bookings',
    title: 'Mis Reservas',
    focusedIcon: 'calendar-check',
    unfocusedIcon: 'calendar-blank',
  },
  {
    key: 'chat',
    title: 'Chats',
    focusedIcon: 'chat',
    unfocusedIcon: 'chat-outline',
  },
  {
    key: 'profile',
    title: 'Perfil',
    focusedIcon: 'account',
    unfocusedIcon: 'account-outline',
  },
];

export default function ClientDashboard() {
  const [index, setIndex] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const fetchUnreadMessages = useCallback(async () => {
    try {
      const data = await messagesApi.unreadCount();
      setUnreadMessages(data.unreadCount);
    } catch {
    }
  }, []);

  const fetchUnreadNotifs = useCallback(async () => {
    try {
      const data = await notificationsApi.unreadCount();
      setUnreadNotifs(data.unreadCount);
    } catch {
    }
  }, []);

  useEffect(() => {
    fetchUnreadMessages();
    fetchUnreadNotifs();

    const msgId = setInterval(fetchUnreadMessages, 10_000);
    const notifId = setInterval(fetchUnreadNotifs, 30_000);

    return () => {
      clearInterval(msgId);
      clearInterval(notifId);
    };
  }, [fetchUnreadMessages, fetchUnreadNotifs]);

  const handleIndexChange = (newIndex: number) => {
    setIndex(newIndex);
    if (ROUTES[newIndex]?.key === 'chat') {
      setTimeout(fetchUnreadMessages, 2000);
    }
    if (ROUTES[newIndex]?.key === 'profile') {
      setTimeout(fetchUnreadNotifs, 1000);
    }
  };

  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'professionals':
        return <ProfessionalsRoute />;
      case 'map':
        return <MapRoute />;
      case 'bookings':
        return <BookingsRoute />;
      case 'chat':
        return <ChatRoute />;
      case 'profile':
        return <ProfileRoute unreadNotifs={unreadNotifs} />;
      default:
        return null;
    }
  };

  const renderBadge = ({ route }: { route: { key: string } }) => {
    if (route.key === 'chat' && unreadMessages > 0) {
      return (
        <View style={s.badge}>
          <Text style={s.badgeText}>
            {unreadMessages > 9 ? '9+' : String(unreadMessages)}
          </Text>
        </View>
      );
    }
    if (route.key === 'profile' && unreadNotifs > 0) {
      return (
        <View style={s.badge}>
          <Text style={s.badgeText}>
            {unreadNotifs > 9 ? '9+' : String(unreadNotifs)}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <BottomNavigation
      navigationState={{ index, routes: ROUTES }}
      onIndexChange={handleIndexChange}
      renderScene={renderScene}
      renderBadge={renderBadge}
      barStyle={s.bar}
    />
  );
}

const s = StyleSheet.create({
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
