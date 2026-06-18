import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { messagesApi, bookingsApi } from '../../api';
import type { Message, Booking } from '../../types';

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function fmtDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hoy';
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'long' });
}

interface Props {
  booking: Booking;
  onBack: () => void;
}

export default function ChatScreen({ booking, onBack }: Props) {
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCountRef = useRef(0);

  const isClient = userId === booking.clientId;
  const otherName = isClient ? booking.professionalName : booking.clientName;

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const data = await messagesApi.getByBooking(booking.id);
      setMessages(data);
      if (!silent) setLoading(false);
      if (data.length > lastCountRef.current) {
        lastCountRef.current = data.length;
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch {
      if (!silent) setLoading(false);
    }
  }, [booking.id]);

  useEffect(() => {
    fetchMessages(false).then(() => {
      messagesApi.markAsRead(booking.id).catch(() => {});
    });
  }, [fetchMessages, booking.id]);

  useEffect(() => {
    pollingRef.current = setInterval(() => fetchMessages(true), 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchMessages]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput('');
    try {
      const saved = await messagesApi.send(booking.id, content);
      setMessages(prev => [...prev, saved]);
      lastCountRef.current += 1;
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo enviar');
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMine = item.senderId === userId;
    const prev = messages[index - 1];
    const showDay = !prev || fmtDay(item.createdAt) !== fmtDay(prev.createdAt);
    const showName = !isMine && (!prev || prev.senderId !== item.senderId);

    return (
      <>
        {showDay && (
          <View style={s.dayRow}>
            <Text style={s.dayLabel}>{fmtDay(item.createdAt)}</Text>
          </View>
        )}
        {showName && <Text style={s.senderName}>{item.senderName}</Text>}
        <View style={[s.bubbleRow, isMine ? s.bubbleRowMine : s.bubbleRowOther]}>
          <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleOther]}>
            <Text style={[s.bubbleText, isMine ? s.bubbleTextMine : s.bubbleTextOther]}>
              {item.content}
            </Text>
            <Text style={[s.bubbleMeta, isMine ? s.bubbleMetaMine : s.bubbleMetaOther]}>
              {fmtTime(item.createdAt)}{isMine ? (item.isRead ? '  ✓✓' : '  ✓') : ''}
            </Text>
          </View>
        </View>
      </>
    );
  };

  const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Pendiente', CONFIRMED: 'Confirmada',
    IN_PROGRESS: 'En progreso', COMPLETED: 'Completada', CANCELLED: 'Cancelada',
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.headerName}>{otherName}</Text>
          <Text style={s.headerSub}>
            {booking.serviceName} · {STATUS_LABELS[booking.status] ?? booking.status}
          </Text>
        </View>
        <View style={s.liveIndicator} />
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#6c63ff" />
        </View>
      ) : messages.length === 0 ? (
        <View style={s.centered}>
          <Text style={s.emptyIcon}>💬</Text>
          <Text style={s.emptyTitle}>Sin mensajes aún</Text>
          <Text style={s.emptySubtitle}>Envía el primer mensaje a {otherName}</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => String(item.id)}
          renderItem={renderMessage}
          contentContainerStyle={s.msgList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {booking.status === 'CANCELLED' ? (
        <View style={s.closedBanner}>
          <Text style={s.closedText}>❌ Reserva cancelada — chat cerrado</Text>
        </View>
      ) : (
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder={`Mensaje a ${otherName}...`}
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnDisabled]}
            onPress={send}
            disabled={!input.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.sendIcon}>➤</Text>}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb', elevation: 2,
  },
  backBtn: { padding: 8, marginRight: 4 },
  backText: { fontSize: 22, color: '#6c63ff' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  headerSub: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  liveIndicator: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#10b981', marginLeft: 8,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySubtitle: { fontSize: 13, color: '#6b7280' },
  msgList: { padding: 12, gap: 2 },
  dayRow: { alignItems: 'center', marginVertical: 10 },
  dayLabel: {
    fontSize: 11, color: '#9ca3af', backgroundColor: '#e5e7eb',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
  },
  senderName: { fontSize: 11, color: '#6b7280', marginLeft: 12, marginBottom: 2 },
  bubbleRow: { flexDirection: 'row', marginBottom: 3 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowOther: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 18, elevation: 1,
  },
  bubbleMine: { backgroundColor: '#6c63ff', borderBottomRightRadius: 4 },
  bubbleOther: {
    backgroundColor: '#fff', borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },
  bubbleTextOther: { color: '#1f2937' },
  bubbleMeta: { fontSize: 10, marginTop: 3 },
  bubbleMetaMine: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  bubbleMetaOther: { color: '#9ca3af' },
  closedBanner: {
    padding: 14, backgroundColor: '#fee2e2', borderTopWidth: 1,
    borderTopColor: '#fca5a5', alignItems: 'center',
  },
  closedText: { fontSize: 13, color: '#b91c1c', fontWeight: '600' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 10,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 8,
  },
  input: {
    flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14,
    color: '#1f2937', maxHeight: 100,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#6c63ff',
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#d1d5db' },
  sendIcon: { color: '#fff', fontSize: 16 },
});
