import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MapScreen() {
    return (
        <View style={s.container}>
            <Text style={s.msg}>Mapa no disponible en la versión web. Usa la app en dispositivo móvil.</Text>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    msg: { color: '#6b7280', textAlign: 'center' },
});
