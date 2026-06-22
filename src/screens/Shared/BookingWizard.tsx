import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  FlatList, ActivityIndicator, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { professionalsApi, bookingsApi } from '../../api';
import { mapApi } from '../../api';
import type { Professional, Booking, ServiceItem } from '../../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: (b: Booking) => void;
  initialProfessional?: Professional;
}

type Step = 'pro' | 'service' | 'details';

function Avatar({ name }: { name: string }) {
  const COLORS = ['#6c63ff', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#10b981'];
  const color = COLORS[name.charCodeAt(0) % COLORS.length];
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={[av.circle, { backgroundColor: color }]}>
      <Text style={av.text}>{initials}</Text>
    </View>
  );
}
const av = StyleSheet.create({
  circle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

export default function BookingWizard({ visible, onClose, onCreated, initialProfessional }: Props) {
  const [step, setStep] = useState<Step>('pro');
  const [pros, setPros] = useState<Professional[]>([]);
  const [pro, setPro] = useState<Professional | null>(null);
  const [svc, setSvc] = useState<ServiceItem | null>(null);
  const [search, setSearch] = useState('');
  const [loadingPros, setLoadingPros] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ scheduledAt: '', address: '', description: '' });
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  useEffect(() => {
    if (!visible) return;
    setErr('');
    setSearch('');
    setForm({ scheduledAt: '', address: '', description: '' });
    setDateStr('');
    setTimeStr('');
    setSvc(null);

    if (initialProfessional) {
      setPro(initialProfessional);
      setStep('service');
    } else {
      setPro(null);
      setStep('pro');
      setLoadingPros(true);
      professionalsApi.nearby(-12.0464, -77.0428, 30)
        .then(setPros).catch(() => { }).finally(() => setLoadingPros(false));
    }
  }, [visible, initialProfessional]);

  const filtered = pros.filter(p =>
    p.userName.toLowerCase().includes(search.toLowerCase()) ||
    p.specialty.toLowerCase().includes(search.toLowerCase())
  );

  const submit = async () => {
    if (!pro || !svc) return;
    if (!dateStr || !timeStr) { setErr('Ingresa fecha y hora'); return; }
    if (!form.address.trim()) { setErr('La dirección es obligatoria'); return; }
    const scheduledAt = `${dateStr}T${timeStr}:00`;
    if (new Date(scheduledAt) <= new Date()) { setErr('La fecha debe ser en el futuro'); return; }
    setSubmitting(true); setErr('');
    try {
      const b = await bookingsApi.create({
        professionalId: pro.id,
        serviceId: svc.id,
        scheduledAt,
        address: form.address,
        description: form.description || undefined,
      });
      onCreated(b);
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error al crear reserva');
    }
    setSubmitting(false);
  };

  const STEP_LABELS = ['Profesional', 'Servicio', 'Detalles'];
  const STEP_KEYS: Step[] = ['pro', 'service', 'details'];
  const currentIdx = STEP_KEYS.indexOf(step);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={s.container}>
        { }
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}><Text style={s.close}>✕</Text></TouchableOpacity>
          <Text style={s.headerTitle}>Nueva reserva</Text>
          <View style={{ width: 32 }} />
        </View>

        { }
        <View style={s.stepper}>
          {STEP_LABELS.map((label, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <React.Fragment key={label}>
                <View style={s.stepItem}>
                  <View style={[s.stepCircle,
                  done ? s.stepDone : active ? s.stepActive : s.stepFuture]}>
                    <Text style={[s.stepNum, (done || active) ? s.stepNumLight : s.stepNumDark]}>
                      {done ? '✓' : i + 1}
                    </Text>
                  </View>
                  <Text style={[s.stepLabel, active ? s.stepLabelActive : s.stepLabelInactive]}>
                    {label}
                  </Text>
                </View>
                {i < 2 && <View style={[s.stepLine, done ? s.stepLineDone : s.stepLineGray]} />}
              </React.Fragment>
            );
          })}
        </View>

        { }
        {step === 'pro' && (
          <View style={s.stepBody}>
            <TextInput
              style={s.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="🔍 Buscar profesional..."
              placeholderTextColor="#9ca3af"
            />
            {loadingPros ? (
              <ActivityIndicator size="large" color="#6c63ff" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={item => String(item.id)}
                renderItem={({ item: p }) => (
                  <TouchableOpacity
                    style={s.proCard}
                    onPress={() => { setPro(p); setStep('service'); }}
                  >
                    <Avatar name={p.userName} />
                    <View style={s.proInfo}>
                      <View style={s.proNameRow}>
                        <Text style={s.proName}>{p.userName}</Text>
                        {p.isVerified && <Text style={s.verified}>✓</Text>}
                      </View>
                      <Text style={s.proSpec}>{p.specialty}</Text>
                      <View style={s.proMeta}>
                        <Text style={s.stars}>★ {(p.averageRating ?? 0).toFixed(1)}</Text>
                        <Text style={s.rate}>S/. {p.baseRate}/hr</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={s.empty}>Sin resultados</Text>}
                contentContainerStyle={{ padding: 16, gap: 10 }}
              />
            )}
          </View>
        )}

        { }
        {step === 'service' && pro && (
          <View style={s.stepBody}>
            <View style={s.selectedPro}>
              <Avatar name={pro.userName} />
              <View style={{ flex: 1 }}>
                <Text style={s.proName}>{pro.userName}</Text>
                <Text style={s.proSpec}>{pro.specialty}</Text>
              </View>
              {!initialProfessional && (
                <TouchableOpacity onPress={() => { setStep('pro'); setPro(null); }}>
                  <Text style={s.changeTxt}>Cambiar</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={s.sectionLabel}>Elige el servicio</Text>
            {pro.services.length === 0 ? (
              <Text style={s.empty}>Sin servicios registrados</Text>
            ) : (
              <FlatList
                data={pro.services}
                keyExtractor={item => String(item.id)}
                renderItem={({ item: sv }) => (
                  <TouchableOpacity
                    style={s.svcCard}
                    onPress={() => { setSvc(sv); setStep('details'); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.svcName}>{sv.name}</Text>
                      {sv.description && <Text style={s.svcDesc}>{sv.description}</Text>}
                      {sv.estimatedDurationHours && (
                        <Text style={s.svcMeta}>⏱ ~{sv.estimatedDurationHours}h estimado</Text>
                      )}
                    </View>
                    {sv.referencePrice && (
                      <View>
                        <Text style={s.svcPrice}>S/. {sv.referencePrice}</Text>
                        <Text style={s.svcPriceLbl}>precio ref.</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ padding: 16, gap: 10 }}
              />
            )}
          </View>
        )}

        { }
        {step === 'details' && pro && svc && (
          <View style={[s.stepBody, { padding: 20 }]}>
            <View style={s.chipsRow}>
              <View style={[s.chip, s.chipPurple]}><Text style={s.chipText}>👤 {pro.userName}</Text></View>
              <View style={[s.chip, s.chipGreen]}><Text style={s.chipText}>🔧 {svc.name}</Text></View>
              {svc.referencePrice && (
                <View style={[s.chip, s.chipAmber]}><Text style={s.chipText}>💰 S/. {svc.referencePrice}</Text></View>
              )}
            </View>

            <Text style={s.fieldLabel}>FECHA (YYYY-MM-DD) *</Text>
            <TouchableOpacity onPress={() => { setTempDate(new Date()); setShowDatePicker(true); }} style={[s.input, { justifyContent: 'center' }]}>
              <Text style={{ color: dateStr ? '#111827' : '#9ca3af' }}>{dateStr || 'Selecciona fecha'}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="default"
                onChange={(e, selected) => {
                  setShowDatePicker(false);
                  if (selected) {
                    const d = selected;
                    const iso = d.toISOString().slice(0, 10);
                    setDateStr(iso);
                  }
                }}
              />
            )}

            <Text style={[s.fieldLabel, { marginTop: 12 }]}>HORA (HH:MM) *</Text>
            <TouchableOpacity onPress={() => { setTempDate(new Date()); setShowTimePicker(true); }} style={[s.input, { justifyContent: 'center' }]}>
              <Text style={{ color: timeStr ? '#111827' : '#9ca3af' }}>{timeStr || 'Selecciona hora'}</Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={tempDate}
                mode="time"
                display="default"
                onChange={(e, selected) => {
                  setShowTimePicker(false);
                  if (selected) {
                    const d = selected;
                    const hh = String(d.getHours()).padStart(2, '0');
                    const mm = String(d.getMinutes()).padStart(2, '0');
                    setTimeStr(`${hh}:${mm}`);
                  }
                }}
              />
            )}

            <Text style={[s.fieldLabel, { marginTop: 12 }]}>DIRECCIÓN *</Text>
            <TextInput
              style={s.input}
              value={form.address}
              onChangeText={v => setForm(p => ({ ...p, address: v }))}
              placeholder="Av. Larco 345, Miraflores"
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity style={{ marginTop: 8 }} onPress={async () => {
              if (!form.address.trim()) return;
              try {
                const res = await mapApi.geocode(form.address.trim());
                if (res?.length > 0) {
                  const first = Array.isArray(res) ? res[0] : res;
                  if (first?.formattedAddress) setForm(p => ({ ...p, address: first.formattedAddress }));
                }
              } catch {
              }
            }}>
              <Text style={{ color: '#6c63ff', fontWeight: '700' }}>Buscar dirección</Text>
            </TouchableOpacity>

            <Text style={[s.fieldLabel, { marginTop: 12 }]}>DESCRIPCIÓN (OPCIONAL)</Text>
            <TextInput
              style={[s.input, { height: 80, textAlignVertical: 'top' }]}
              value={form.description}
              onChangeText={v => setForm(p => ({ ...p, description: v }))}
              placeholder="Describe qué necesitas..."
              placeholderTextColor="#9ca3af"
              multiline
            />

            {err ? <Text style={s.errTxt}>{err}</Text> : null}

            <View style={s.detailsFooter}>
              <TouchableOpacity style={s.backStepBtn} onPress={() => setStep('service')}>
                <Text style={s.backStepTxt}>← Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={submit} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.confirmTxt}>Confirmar reserva</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  close: { fontSize: 20, color: '#9ca3af', padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937' },
  stepper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2,
  },
  stepDone: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  stepActive: { backgroundColor: 'transparent', borderColor: '#6c63ff' },
  stepFuture: { backgroundColor: 'transparent', borderColor: '#d1d5db' },
  stepNum: { fontSize: 12, fontWeight: '700' },
  stepNumLight: { color: '#6c63ff' },
  stepNumDark: { color: '#9ca3af' },
  stepLabel: { fontSize: 10, fontWeight: '600' },
  stepLabelActive: { color: '#6c63ff' },
  stepLabelInactive: { color: '#9ca3af' },
  stepLine: { flex: 1, height: 2, marginBottom: 14, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: '#6c63ff' },
  stepLineGray: { backgroundColor: '#e5e7eb' },
  stepBody: { flex: 1 },
  searchInput: {
    margin: 16, backgroundColor: '#f3f4f6', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#1f2937',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  proCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fafafa', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  proInfo: { flex: 1, gap: 2 },
  proNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  proName: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  verified: { color: '#10b981', fontSize: 13 },
  proSpec: { fontSize: 12, color: '#6c63ff', fontWeight: '500' },
  proMeta: { flexDirection: 'row', gap: 10, marginTop: 2 },
  stars: { fontSize: 12, color: '#f59e0b' },
  rate: { fontSize: 12, color: '#10b981', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 14 },
  selectedPro: {
    flexDirection: 'row', alignItems: 'center', gap: 12, margin: 16,
    backgroundColor: '#ede9fe', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#c4b5fd',
  },
  changeTxt: { color: '#6c63ff', fontSize: 12, fontWeight: '700' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', marginLeft: 16, marginBottom: 0 },
  svcCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fafafa', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  svcName: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  svcDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  svcMeta: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  svcPrice: { fontSize: 16, fontWeight: '800', color: '#10b981', textAlign: 'right' },
  svcPriceLbl: { fontSize: 10, color: '#9ca3af', textAlign: 'right' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipPurple: { backgroundColor: '#ede9fe', borderColor: '#c4b5fd' },
  chipGreen: { backgroundColor: '#ecfdf5', borderColor: '#6ee7b7' },
  chipAmber: { backgroundColor: '#fffbeb', borderColor: '#fcd34d' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginBottom: 6 },
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1f2937',
  },
  errTxt: { color: '#ef4444', fontSize: 13, marginTop: 8 },
  detailsFooter: { flexDirection: 'row', gap: 12, marginTop: 20 },
  backStepBtn: {
    flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  backStepTxt: { fontSize: 15, fontWeight: '600', color: '#374151' },
  confirmBtn: {
    flex: 1, backgroundColor: '#6c63ff', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  confirmTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
