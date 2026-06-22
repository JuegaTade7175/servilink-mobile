import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Avatar } from 'react-native-paper';
import { reviewsApi, professionalsApi } from '../../api';
import type { Professional, Review } from '../../types';

interface Props {
    professionalId: number;
    visible: boolean;
    onClose: () => void;
}

export default function ProfessionalDetail({ professionalId, visible, onClose }: Props) {
    const [pro, setPro] = useState<Professional | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!visible) return;
        setLoading(true);
        Promise.all([professionalsApi.getById(professionalId), reviewsApi.byProfessional(professionalId)])
            .then(([p, rv]) => { setPro(p); setReviews(rv.slice(0, 5)); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [professionalId, visible]);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={s.container}>
                <View style={s.header}>
                    <TouchableOpacity onPress={onClose}><Text style={s.close}>✕</Text></TouchableOpacity>
                    <Text style={s.title}>Perfil</Text>
                    <View style={{ width: 32 }} />
                </View>

                {loading || !pro ? (
                    <View style={s.center}><ActivityIndicator size="large" color="#6c63ff" /></View>
                ) : (
                    <View style={{ padding: 16 }}>
                        <View style={s.row}><Avatar.Text size={72} label={pro.userName.slice(0, 2).toUpperCase()} /><View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={s.name}>{pro.userName}</Text>
                            <Text style={s.spec}>{pro.specialty}</Text>
                            <Text style={s.meta}>★ {pro.averageRating?.toFixed(1)} · S/. {pro.baseRate}/hr</Text>
                        </View></View>

                        <Text style={s.section}>Descripción</Text>
                        <Text style={s.paragraph}>{pro.description || 'Sin descripción'}</Text>

                        <Text style={s.section}>Reseñas recientes</Text>
                        {reviews.length === 0 ? (
                            <Text style={s.paragraph}>Sin reseñas</Text>
                        ) : (
                            <FlatList
                                data={reviews}
                                keyExtractor={r => String(r.id)}
                                renderItem={({ item }) => (
                                    <View style={s.revItem}>
                                        <Text style={s.revHeader}>★ {item.rating} · {item.clientName}</Text>
                                        {item.comment ? <Text style={s.revBody}>{item.comment}</Text> : null}
                                    </View>
                                )}
                            />
                        )}
                    </View>
                )}
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    close: { fontSize: 20, color: '#6b7280' },
    title: { fontSize: 16, fontWeight: '700', color: '#111827' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    name: { fontSize: 18, fontWeight: '800' },
    spec: { color: '#6c63ff', fontWeight: '600' },
    meta: { color: '#6b7280', marginTop: 4 },
    section: { marginTop: 14, fontSize: 13, fontWeight: '700', color: '#6b7280' },
    paragraph: { marginTop: 6, color: '#374151' },
    revItem: { marginTop: 10, padding: 10, backgroundColor: '#f8fafc', borderRadius: 8 },
    revHeader: { fontWeight: '700', color: '#111827' },
    revBody: { marginTop: 6, color: '#374151' },
});
