import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { bookingsApi, paymentsApi, confirmationsApi, reviewsApi } from '../../api';
import type { Booking, Payment, BookingConfirmation, Review, PaymentMethod } from '../../types';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:     { label: 'Pendiente',   bg: '#fef3c7', text: '#92400e' },
  CONFIRMED:   { label: 'Confirmada',  bg: '#ede9fe', text: '#5b21b6' },
  IN_PROGRESS: { label: 'En progreso', bg: '#ede9fe', text: '#7c3aed' },
  COMPLETED:   { label: 'Completada',  bg: '#ecfdf5', text: '#065f46' },
  CANCELLED:   { label: 'Cancelada',   bg: '#fee2e2', text: '#991b1b' },
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string; desc: string }[] = [
  { value: 'CARD',          label: 'Tarjeta',       icon: '💳', desc: 'Visa, Mastercard, Amex' },
  { value: 'YAPE',          label: 'Yape',          icon: '📱', desc: 'Pago con QR instantáneo' },
  { value: 'BANK_TRANSFER', label: 'Transferencia', icon: '🏦', desc: 'BCP, Interbank, BBVA' },
];

interface Props {
  booking: Booking;
  onBack: () => void;
  onUpdated: (b: Booking) => void;
}

export default function BookingDetailScreen({ booking: initialBooking, onBack, onUpdated }: Props) {
  const [booking, setBooking] = useState(initialBooking);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Payment modal
  const [showPay, setShowPay] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('CARD');
  const [payAmount, setPayAmount] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  // Confirmation modal
  const [showConf, setShowConf] = useState(false);
  const [confCode, setConfCode] = useState('');
  const [confLoading, setConfLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  // Review modal
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const loadExtra = useCallback(async () => {
    setLoadingExtra(true);
    const [pay, conf, revs] = await Promise.allSettled([
      paymentsApi.getByBooking(booking.id),
      confirmationsApi.getStatus(booking.id),
      reviewsApi.byProfessional(booking.professionalId),
    ]);
    setPayment(pay.status === 'fulfilled' ? pay.value : null);
    setConfirmation(conf.status === 'fulfilled' ? conf.value : null);
    setReviews(revs.status === 'fulfilled' ? revs.value : []);
    setLoadingExtra(false);
  }, [booking.id, booking.professionalId]);

  useEffect(() => { loadExtra(); }, [loadExtra]);

  const changeStatus = async (status: string) => {
    setUpdatingStatus(status);
    try {
      const updated = await bookingsApi.updateStatus(booking.id, status);
      setBooking(updated);
      onUpdated(updated);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo actualizar');
    }
    setUpdatingStatus(null);
  };

  const processPayment = async () => {
    const a = parseFloat(payAmount);
    if (isNaN(a) || a <= 0) { Alert.alert('Error', 'Ingresa un monto válido'); return; }
    setPayLoading(true);
    try {
      const p = await paymentsApi.process(booking.id, a, payMethod);
      setPayment(p);
      setShowPay(false);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo procesar');
    }
    setPayLoading(false);
  };

  const generateCode = async () => {
    setGenLoading(true);
    try {
      const c = await confirmationsApi.generate(booking.id);
      setConfirmation(c);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Error generando código');
    }
    setGenLoading(false);
  };

  const confirmCode = async () => {
    if (confCode.length !== 6) { Alert.alert('Error', 'El código debe tener 6 dígitos'); return; }
    setConfLoading(true);
    try {
      await confirmationsApi.confirm(confCode);
      await loadExtra();
      setShowConf(false);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Código inválido o expirado');
    }
    setConfLoading(false);
  };

  const submitReview = async () => {
    setReviewLoading(true);
    try {
      const r = await reviewsApi.create(booking.id, rating, comment);
      setReviews(prev => [...prev, r]);
      setShowReview(false);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Error al enviar la reseña');
    }
    setReviewLoading(false);
  };

  const statusCfg = STATUS_CFG[booking.status] ?? { label: booking.status, bg: '#f3f4f6', text: '#6b7280' };

  type ActionDef = { label: string; icon: string; status: string; color: string };
  const actions: ActionDef[] = ({
    PENDING:     [
      { label: 'Confirmar', icon: '✅', status: 'CONFIRMED', color: '#10b981' },
      { label: 'Cancelar',  icon: '❌', status: 'CANCELLED', color: '#ef4444' },
    ],
    CONFIRMED:   [
      { label: 'Iniciar',  icon: '🔧', status: 'IN_PROGRESS', color: '#6c63ff' },
      { label: 'Cancelar', icon: '❌', status: 'CANCELLED',   color: '#ef4444' },
    ],
    IN_PROGRESS: [
      { label: 'Completar', icon: '🎉', status: 'COMPLETED', color: '#10b981' },
    ],
  } as Record<string, ActionDef[]>)[booking.status] ?? [];

  const canPay = booking.status !== 'CANCELLED' && !payment;
  const canConf = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  const existingReview = reviews.find(r => r.bookingId === booking.id);
  const canReview = booking.status === 'COMPLETED' && !existingReview;
  const noConf = !confirmation || confirmation.status === 'EXPIRED' || confirmation.status === 'CANCELLED';

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle} numberOfLines={1}>{booking.serviceName}</Text>
          <Text style={s.headerSub}>Reserva #{booking.id}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[s.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {/* Info grid */}
        <View style={s.grid}>
          <Field label="👤 Profesional" value={booking.professionalName} />
          <Field label="👥 Cliente"     value={booking.clientName} />
          <Field label="📅 Fecha"       value={fmtDate(booking.scheduledAt)} wide />
          <Field label="📍 Dirección"   value={booking.address} wide />
          {booking.description && <Field label="📝 Descripción" value={booking.description} wide />}
        </View>

        {/* Status actions */}
        {actions.length > 0 && (
          <Section title="Cambiar estado">
            <View style={s.actionsRow}>
              {actions.map(a => (
                <TouchableOpacity
                  key={a.status}
                  style={[s.actionBtn, { borderColor: a.color }]}
                  onPress={() => changeStatus(a.status)}
                  disabled={!!updatingStatus}
                >
                  {updatingStatus === a.status
                    ? <ActivityIndicator size="small" color={a.color} />
                    : <>
                        <Text style={s.actionIcon}>{a.icon}</Text>
                        <Text style={[s.actionLabel, { color: a.color }]}>{a.label}</Text>
                      </>}
                </TouchableOpacity>
              ))}
            </View>
          </Section>
        )}

        {/* Payment */}
        <Section title="💳 Pago">
          {loadingExtra ? <ActivityIndicator size="small" color="#6c63ff" /> :
            payment ? (
              <View style={s.payCard}>
                <Text style={s.payAmount}>S/. {Number(payment.amount).toFixed(2)}</Text>
                <Text style={s.payMeta}>
                  {PAYMENT_METHODS.find(m => m.value === payment.method)?.label ?? payment.method}
                  {' · '}{payment.transactionId}
                </Text>
                <Text style={s.payMeta}>{payment.paidAt ? fmtDateShort(payment.paidAt) : '—'}</Text>
                <View style={[s.statusBadge, { backgroundColor: '#ecfdf5' }]}>
                  <Text style={[s.statusText, { color: '#065f46' }]}>{payment.status}</Text>
                </View>
              </View>
            ) : (
              <View style={s.emptyRow}>
                <Text style={s.emptyText}>Sin pago registrado</Text>
                {canPay && (
                  <TouchableOpacity style={s.smallBtn} onPress={() => setShowPay(true)}>
                    <Text style={s.smallBtnText}>Pagar</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
        </Section>

        {/* Confirmation */}
        <Section title="🔐 Confirmación de cita">
          {loadingExtra ? <ActivityIndicator size="small" color="#6c63ff" /> :
            <View style={s.emptyRow}>
              {confirmation ? (
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[s.confStatus, { color: confirmation.status === 'CONFIRMED' ? '#059669' : '#d97706' }]}>
                    {confirmation.status === 'CONFIRMED' ? '✅ Confirmada'
                      : confirmation.status === 'PENDING' ? '⏳ Pendiente' : `⚠️ ${confirmation.status}`}
                  </Text>
                  {confirmation.status === 'PENDING' && (
                    <Text style={s.confCode}>{confirmation.confirmationCode}</Text>
                  )}
                </View>
              ) : (
                <Text style={s.emptyText}>Sin código generado</Text>
              )}
              {canConf && (
                <TouchableOpacity style={s.smallBtn} onPress={() => setShowConf(true)}>
                  <Text style={s.smallBtnText}>Gestionar</Text>
                </TouchableOpacity>
              )}
            </View>}
        </Section>

        {/* Review */}
        {booking.status === 'COMPLETED' && (
          <Section title="⭐ Reseña">
            {existingReview ? (
              <View style={s.reviewCard}>
                <View style={s.starsRow}>
                  {[1,2,3,4,5].map(i => (
                    <Text key={i} style={[s.star, i <= existingReview.rating ? s.starFilled : s.starEmpty]}>★</Text>
                  ))}
                  <Text style={s.reviewDate}>{fmtDateShort(existingReview.createdAt)}</Text>
                </View>
                {existingReview.comment && <Text style={s.reviewComment}>"{existingReview.comment}"</Text>}
              </View>
            ) : canReview ? (
              <View style={s.emptyRow}>
                <Text style={s.emptyText}>¿Cómo fue el servicio?</Text>
                <TouchableOpacity style={s.smallBtn} onPress={() => setShowReview(true)}>
                  <Text style={s.smallBtnText}>Reseñar</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </Section>
        )}
      </ScrollView>

      {/* ── PAYMENT MODAL ── */}
      <Modal visible={showPay} animationType="slide" presentationStyle="pageSheet">
        <View style={m.container}>
          <View style={m.header}>
            <Text style={m.title}>Procesar pago</Text>
            <TouchableOpacity onPress={() => setShowPay(false)}><Text style={m.close}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={m.body}>
            <Text style={m.label}>MÉTODO DE PAGO</Text>
            {PAYMENT_METHODS.map(method => (
              <TouchableOpacity
                key={method.value}
                style={[m.methodRow, payMethod === method.value && m.methodRowActive]}
                onPress={() => setPayMethod(method.value)}
              >
                <Text style={m.methodIcon}>{method.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={m.methodLabel}>{method.label}</Text>
                  <Text style={m.methodDesc}>{method.desc}</Text>
                </View>
                <View style={[m.radio, payMethod === method.value && m.radioActive]} />
              </TouchableOpacity>
            ))}
            <Text style={[m.label, { marginTop: 20 }]}>MONTO (S/.)</Text>
            <TextInput
              style={m.input}
              value={payAmount}
              onChangeText={setPayAmount}
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
            />
          </ScrollView>
          <View style={m.footer}>
            <TouchableOpacity style={m.cancelBtn} onPress={() => setShowPay(false)}>
              <Text style={m.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={m.confirmBtn} onPress={processPayment} disabled={payLoading}>
              {payLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={m.confirmText}>💳 Pagar ahora</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── CONFIRMATION MODAL ── */}
      <Modal visible={showConf} animationType="slide" presentationStyle="pageSheet">
        <View style={m.container}>
          <View style={m.header}>
            <Text style={m.title}>Confirmación de cita</Text>
            <TouchableOpacity onPress={() => setShowConf(false)}><Text style={m.close}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={m.body}>
            {noConf ? (
              <View style={m.centeredBlock}>
                <Text style={m.bigIcon}>🔐</Text>
                <Text style={m.blockText}>Genera un código de 6 dígitos para que el profesional confirme la cita.</Text>
                <TouchableOpacity style={m.confirmBtn} onPress={generateCode} disabled={genLoading}>
                  {genLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={m.confirmText}>Generar código</Text>}
                </TouchableOpacity>
              </View>
            ) : confirmation?.status === 'CONFIRMED' ? (
              <View style={m.centeredBlock}>
                <Text style={m.bigIcon}>✅</Text>
                <Text style={[m.blockText, { color: '#059669', fontWeight: '700', fontSize: 18 }]}>¡Cita confirmada!</Text>
                {confirmation.confirmedAt && (
                  <Text style={m.blockText}>Confirmada el {fmtDate(confirmation.confirmedAt)}</Text>
                )}
              </View>
            ) : (
              <>
                <View style={m.codeBox}>
                  <Text style={m.codeLabel}>CÓDIGO DE CONFIRMACIÓN</Text>
                  <Text style={m.codeValue}>{confirmation?.confirmationCode}</Text>
                  {confirmation?.expiresAt && (
                    <Text style={m.codeSub}>Válido hasta: {fmtDate(confirmation.expiresAt)}</Text>
                  )}
                </View>
                <Text style={[m.label, { marginTop: 20 }]}>¿Eres el profesional? Ingresa el código</Text>
                <TextInput
                  style={[m.input, { textAlign: 'center', fontSize: 28, letterSpacing: 10, fontWeight: '800' }]}
                  value={confCode}
                  onChangeText={v => setConfCode(v.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity style={m.confirmBtn} onPress={confirmCode} disabled={confLoading}>
                  {confLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={m.confirmText}>Confirmar</Text>}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ── REVIEW MODAL ── */}
      <Modal visible={showReview} animationType="slide" presentationStyle="pageSheet">
        <View style={m.container}>
          <View style={m.header}>
            <Text style={m.title}>Dejar reseña</Text>
            <TouchableOpacity onPress={() => setShowReview(false)}><Text style={m.close}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={m.body}>
            <Text style={m.blockText}>¿Cómo calificarías a {booking.professionalName}?</Text>
            <View style={m.starsRow}>
              {[1,2,3,4,5].map(i => (
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                  <Text style={[m.ratingStar, i <= rating ? m.ratingStarFilled : m.ratingStarEmpty]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[m.label, { marginTop: 16 }]}>COMENTARIO (OPCIONAL)</Text>
            <TextInput
              style={[m.input, { height: 100, textAlignVertical: 'top' }]}
              value={comment}
              onChangeText={setComment}
              placeholder="Cuéntanos tu experiencia..."
              placeholderTextColor="#9ca3af"
              multiline
            />
          </ScrollView>
          <View style={m.footer}>
            <TouchableOpacity style={m.cancelBtn} onPress={() => setShowReview(false)}>
              <Text style={m.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={m.confirmBtn} onPress={submitReview} disabled={reviewLoading}>
              {reviewLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={m.confirmText}>⭐ Enviar reseña</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={[s.field, wide && s.fieldWide]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value}</Text>
    </View>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb', elevation: 2, gap: 8,
  },
  backBtn: { padding: 8 },
  backText: { fontSize: 22, color: '#6c63ff' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  headerSub: { fontSize: 11, color: '#9ca3af' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  body: { padding: 16, gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  field: { backgroundColor: '#fff', borderRadius: 10, padding: 12, width: '48%', borderWidth: 1, borderColor: '#e5e7eb' },
  fieldWide: { width: '100%' },
  fieldLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  fieldValue: { fontSize: 13, color: '#1f2937', fontWeight: '500' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151' },
  actionsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14,
    paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, backgroundColor: '#fafafa',
  },
  actionIcon: { fontSize: 16 },
  actionLabel: { fontSize: 13, fontWeight: '700' },
  emptyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emptyText: { fontSize: 13, color: '#6b7280' },
  smallBtn: { backgroundColor: '#6c63ff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  smallBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  payCard: { gap: 4 },
  payAmount: { fontSize: 22, fontWeight: '800', color: '#10b981' },
  payMeta: { fontSize: 12, color: '#6b7280' },
  confStatus: { fontSize: 14, fontWeight: '700' },
  confCode: { fontSize: 26, fontWeight: '900', letterSpacing: 8, color: '#6c63ff' },
  reviewCard: { gap: 6 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  star: { fontSize: 20 },
  starFilled: { color: '#f59e0b' },
  starEmpty: { color: '#e5e7eb' },
  reviewDate: { fontSize: 11, color: '#9ca3af', marginLeft: 8 },
  reviewComment: { fontSize: 13, color: '#6b7280', fontStyle: 'italic' },
});

const m = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#1f2937' },
  close: { fontSize: 18, color: '#9ca3af', padding: 4 },
  body: { padding: 20, gap: 12 },
  label: { fontSize: 10, fontWeight: '700', color: '#6b7280', letterSpacing: 1 },
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#1f2937',
  },
  methodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb',
  },
  methodRowActive: { borderColor: '#6c63ff', backgroundColor: '#ede9fe' },
  methodIcon: { fontSize: 24 },
  methodLabel: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  methodDesc: { fontSize: 12, color: '#6b7280' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#d1d5db' },
  radioActive: { borderColor: '#6c63ff', backgroundColor: '#6c63ff' },
  footer: { flexDirection: 'row', padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  cancelBtn: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  confirmBtn: { flex: 1, backgroundColor: '#6c63ff', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  centeredBlock: { alignItems: 'center', gap: 14, paddingVertical: 20 },
  bigIcon: { fontSize: 52 },
  blockText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  codeBox: {
    backgroundColor: '#f5f3ff', borderRadius: 14, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#c4b5fd',
  },
  codeLabel: { fontSize: 10, color: '#7c3aed', fontWeight: '700', letterSpacing: 1 },
  codeValue: { fontSize: 36, fontWeight: '900', letterSpacing: 12, color: '#6c63ff', marginVertical: 8 },
  codeSub: { fontSize: 11, color: '#9ca3af' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 10 },
  ratingStar: { fontSize: 40 },
  ratingStarFilled: { color: '#f59e0b' },
  ratingStarEmpty: { color: '#e5e7eb' },
});
