import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { professionalsApi } from '../../api';
import type { GeoPoint } from '../../types';
import ProfessionalDetail from './ProfessionalDetail';

export default function MapScreen() {
    const [region, setRegion] = useState<any>(null);
    const [points, setPoints] = useState<GeoPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProId, setSelectedProId] = useState<number | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                let loc;
                if (status === Location.PermissionStatus.GRANTED) {
                    const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    loc = { latitude: cur.coords.latitude, longitude: cur.coords.longitude };
                } else {
                    loc = { latitude: -12.0464, longitude: -77.0428 };
                }
                setRegion({ latitude: loc.latitude, longitude: loc.longitude, latitudeDelta: 0.1, longitudeDelta: 0.1 });
                const gp = await professionalsApi.nearby(loc.latitude, loc.longitude, 50);
                // professionalsApi.nearby returns Professional[], map to GeoPoint-like
                const gpoints = gp.map(p => ({
                    professionalId: p.id,
                    name: p.userName,
                    specialty: p.specialty,
                    latitude: p.latitude ?? loc.latitude,
                    longitude: p.longitude ?? loc.longitude,
                    averageRating: p.averageRating,
                    baseRate: p.baseRate,
                    isVerified: p.isVerified,
                } as GeoPoint));
                setPoints(gpoints);
            } catch (e) {
                // ignore
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading || !region) return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#6c63ff" />
        </View>
    );

    return (
        <View style={s.container}>
            <MapView style={s.map} initialRegion={region} region={region} onRegionChangeComplete={setRegion}>
                {points.map(p => (
                    <Marker key={p.professionalId} coordinate={{ latitude: p.latitude, longitude: p.longitude }} pinColor={p.isVerified ? '#10b981' : '#6c63ff'}>
                        <Callout onPress={() => setSelectedProId(p.professionalId)}>
                            <View style={{ width: 180 }}>
                                <Text style={{ fontWeight: '700' }}>{p.name}</Text>
                                <Text style={{ color: '#6b7280' }}>{p.specialty}</Text>
                                <TouchableOpacity style={{ marginTop: 8 }} onPress={() => setSelectedProId(p.professionalId)}>
                                    <Text style={{ color: '#6c63ff', fontWeight: '700' }}>Ver perfil</Text>
                                </TouchableOpacity>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>

            {selectedProId && (
                <ProfessionalDetail
                    professionalId={selectedProId}
                    visible={!!selectedProId}
                    onClose={() => setSelectedProId(null)}
                />
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
});
