import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  ActivityIndicator, Alert, Switch, RefreshControl,
} from 'react-native';
import { availabilityApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import type { Availability, DayOfWeek } from '../../types';

const DAYS: { value: DayOfWeek; label: string; short: string }[] = [
  { value: 'MONDAY',    label: 'Lunes',      short: 'Lun' },
  { value: 'TUESDAY',   label: 'Martes',     short: 'Mar' },
  { value: 'WEDNESDAY', label: 'Miércoles',  short: 'Mié' },
  { value: 'THURSDAY',  label: 'Jueves',     short: 'Jue' },
  { value: 'FRIDAY',    label: 'Viernes',    short: 'Vie' },
  { value: 'SATURDAY',  label: 'Sábado',     short: 'Sáb' },
  { value: 'SUNDAY',    label: 'Domingo',    short: 'Dom' },
];

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Simple time picker using hour/minute selectors
function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h, m] = value.split(':').map(Number);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const mins = [0, 15, 30, 45];
  return (
    <View style={tp.row}>
      <View style={tp.col}>
        {hours.map(hr => (
          <TouchableOpacity
            key={hr}
            style={[tp.cell, hr === h && tp.cellActive]}
            onPress={() => onChange(`${String(hr).padStart(2, '0')}:${String(m).padStart(2, '0')}`)}
          >
            <Text style={[tp.cellText, hr === h && tp.cellTextActive]}>{String(hr).padStart(2, '0')}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={tp.sep}>:</Text>
      <View style={tp.col}>
        {mins.map(mn => (
          <TouchableOpacity
            key={mn}
            style={[tp.cell, mn === m && tp.cellActive]}
            onPress={() => onChange(`${String(h).padStart(2, '0')}:${String(mn).padStart(2, '0')}`)}
          >
            <Text style={[tp.cellText, mn === m && tp.cellTextActive]}>{String(mn).padStart(2, '0')}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const tp = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  col: { flexDirection: 'row', flexWrap: 'wrap', maxWidth: 200, gap: 4 },
  sep: { fontSize: 20, fontWeight: '700', marginHorizontal: 8, color: '#374151' },
  cell: {
    width: 38, height: 32, borderRadius: 6, backgroundColor: '#f3f4f6',
    justifyContent: 'center', alignItems: 'center',
  },
  cellActive: { backgroundColor: '#6c63ff' },
  cellText: { fontSize: 12, color: '#374151' },
  cellTextActive: { color: '#fff', fontWeight: '700' },
});

interface Props {
  professionalId: number;
  professionalName?: string;
  isOwner?: boolean;
  onBack: () => void;
}

export default function AvailabilityScreen({
  professionalId, professionalName, isOwner = false, onBack,
}: Props) {
  const [slots, setSlots] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Availability | null>(null);
  const [day, setDay] = useState<DayOfWeek>('MONDAY');
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('18:00');
  const [avail, setAvail] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const data = await availabilityApi.getByProfessional(professionalId);
      setSlots(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [professionalId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null); setDay('MONDAY'); setStart('08:00'); setEnd('18:00'); setAvail(true);
    setShowModal(true);
  };

  const openEdit = (slot: Availability) => {
    setEditing(slot); setDay(slot.dayOfWeek);
    setStart(slot.startTime.slice(0, 5)); setEnd(slot.endTime.slice(0, 5));
    setAvail(slot.isAvailable); setShowModal(true);
  };

  const save = async () => {
    if (start >= end) { Alert.alert('Error', 'La hora de inicio debe ser antes que la de fin'); return; }
    setSaving(true);
    try {
      if (editing) {
        const updated = await availabilityApi.update(editing.id, { startTime: start, endTime: end, isAvailable: avail });
        setSlots(prev => prev.map(s => s.id === updated.id ? updated : s));
      } else {
        const created = await availabilityApi.create({ dayOfWeek: day, startTime: start, endTime: end });
        setSlots(prev => [...prev, created]);
      }
      setShowModal(false);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    }
    setSaving(false);
  };

  const del = async (id: number) => {
    Alert.alert('Eliminar horario', '¿Confirmas?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          setDeleting(id);
          try {
            await availabilityApi.delete(id);
            setSlots(prev => prev.filter(s => s.id !== id));
          } catch { Alert.alert('Error', 'No se pudo eliminar'); }
          setDeleting(null);
        },
      },
    ]);
  };

  const byDay = DAYS.map(d => ({ ...d, slots: slots.filter(s => s.dayOfWeek === d.value) }));

  const renderDay = ({ item }: { item: typeof byDay[0] }) => {
    if (!isOwner && item.slots.filter(s => s.isAvailable).length === 0) return null;
    return (
      <View style={s.dayBlock}>
        <Text style={s.dayLabel}>{item.label}</Text>
        {item.slots.length === 0 ? (
          <Text style={s.noSlot}>No disponible</Text>
        ) : (
          item.slots
            .filter(sl => isOwner || sl.isAvailable)
            .map(sl => (
              <View key={sl.id} style={s.slotRow}>
                <View style={[s.dot, sl.isAvailable ? s.dotGreen : s.dotGray]} />
                <Text style={s.slotTime}>{fmt12(sl.startTime)} – {fmt12(sl.endTime)}</Text>
                <View style={[s.badge, sl.isAvailable ? s.badgeGreen : s.badgeGray]}>
                  <Text style={[s.badgeText, sl.isAvailable ? s.badgeTextGreen : s.badgeTextGray]}>
                    {sl.isAvailable ? 'Disponible' : 'No disponible'}
                  </Text>
                </View>
                {isOwner && (
                  <View style={s.actions}>
                    <TouchableOpacity onPress={() => openEdit(sl)} style={s.actionBtn}>
                      <Text style={s.editIcon}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => del(sl.id)}
                      disabled={deleting === sl.id}
                      style={s.actionBtn}
                    >
                      {deleting === sl.id
                        ? <ActivityIndicator size="small" color="#ef4444" />
                        : <Text style={s.deleteIcon}>🗑️</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
        )}
      </View>
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>
            {isOwner ? 'Mis Horarios' : `Horarios de ${professionalName ?? 'profesional'}`}
          </Text>
          <Text style={s.subtitle}>{slots.filter(s => s.isAvailable).length} franjas disponibles</Text>
        </View>
        {isOwner && (
          <TouchableOpacity onPress={openCreate} style={s.addBtn}>
            <Text style={s.addBtnText}>＋ Agregar</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#6c63ff" />
        </View>
      ) : slots.length === 0 ? (
        <View style={s.centered}>
          <Text style={s.emptyIcon}>📅</Text>
          <Text style={s.emptyTitle}>Sin horarios configurados</Text>
          {isOwner && (
            <TouchableOpacity onPress={openCreate} style={s.addBtn2}>
              <Text style={s.addBtnText}>＋ Crear primer horario</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={byDay}
          keyExtractor={item => item.value}
          renderItem={renderDay}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          contentContainerStyle={{ padding: 16, gap: 10 }}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={m.container}>
          <View style={m.header}>
            <Text style={m.headerTitle}>{editing ? 'Editar horario' : 'Nuevo horario'}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)} style={m.closeBtn}>
              <Text style={m.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={m.body}>
            {!editing && (
              <>
                <Text style={m.label}>Día de la semana</Text>
                <View style={m.daysRow}>
                  {DAYS.map(d => (
                    <TouchableOpacity
                      key={d.value}
                      onPress={() => setDay(d.value)}
                      style={[m.dayCell, day === d.value && m.dayCellActive]}
                    >
                      <Text style={[m.dayCellText, day === d.value && m.dayCellTextActive]}>
                        {d.short}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {editing && (
              <View style={m.dayDisplay}>
                <Text style={m.dayDisplayText}>
                  📅 {DAYS.find(d => d.value === editing.dayOfWeek)?.label}
                </Text>
              </View>
            )}

            <Text style={m.label}>Hora de inicio</Text>
            <TimePicker value={start} onChange={setStart} />

            <Text style={m.label}>Hora de fin</Text>
            <TimePicker value={end} onChange={setEnd} />

            {editing && (
              <View style={m.switchRow}>
                <Text style={m.switchLabel}>Disponible</Text>
                <Switch
                  value={avail}
                  onValueChange={setAvail}
                  trackColor={{ false: '#d1d5db', true: '#6c63ff' }}
                  thumbColor="#fff"
                />
              </View>
            )}
          </View>

          <View style={m.footer}>
            <TouchableOpacity onPress={() => setShowModal(false)} style={m.cancelBtn}>
              <Text style={m.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} disabled={saving} style={m.saveBtn}>
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={m.saveText}>{editing ? 'Guardar' : 'Crear'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  title: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  addBtn: {
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#6c63ff',
    borderRadius: 8,
  },
  addBtn2: {
    marginTop: 12, paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: '#6c63ff', borderRadius: 8,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 15, color: '#6b7280' },
  dayBlock: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#e5e7eb', elevation: 1, gap: 8,
  },
  dayLabel: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  noSlot: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic' },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  dotGreen: { backgroundColor: '#10b981' },
  dotGray: { backgroundColor: '#9ca3af' },
  slotTime: { fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#1f2937', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  badgeGreen: { backgroundColor: '#ecfdf5', borderColor: '#6ee7b7' },
  badgeGray: { backgroundColor: '#f3f4f6', borderColor: '#d1d5db' },
  badgeText: { fontSize: 10, fontWeight: '600' },
  badgeTextGreen: { color: '#059669' },
  badgeTextGray: { color: '#9ca3af' },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 4 },
  editIcon: { fontSize: 16 },
  deleteIcon: { fontSize: 16 },
});

const m = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937' },
  closeBtn: { padding: 8 },
  closeText: { fontSize: 18, color: '#6b7280' },
  body: { flex: 1, padding: 16, gap: 12 },
  label: { fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayCell: {
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb',
  },
  dayCellActive: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  dayCellText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  dayCellTextActive: { color: '#fff' },
  dayDisplay: {
    backgroundColor: '#ede9fe', borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: '#c4b5fd',
  },
  dayDisplayText: { fontSize: 13, color: '#6c63ff', fontWeight: '600' },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f3f4f6', borderRadius: 10, padding: 14,
  },
  switchLabel: { fontSize: 14, color: '#1f2937' },
  footer: {
    flexDirection: 'row', padding: 16, gap: 10,
    borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#f3f4f6', alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  saveBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#6c63ff', alignItems: 'center',
  },
  saveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// need Platform for fontFamily
import { Platform } from 'react-native';
