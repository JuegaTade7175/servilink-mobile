import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Title, HelperText, SegmentedButtons } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';
import { Role } from '../../types';

export default function RegisterScreen({ navigation }: any) {
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'CLIENT' as Role,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.phone) {
      setError('Por favor complete todos los campos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.register(form);
      await login(res);
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Title style={styles.title}>Crear Cuenta</Title>
          <Text style={styles.subtitle}>Únete a ServiLink hoy mismo</Text>
        </View>

        <View style={styles.form}>
          <SegmentedButtons
            value={form.role}
            onValueChange={v => setForm(f => ({ ...f, role: v as Role }))}
            buttons={[
              { value: 'CLIENT', label: 'Soy Cliente' },
              { value: 'PROFESSIONAL', label: 'Soy Profesional' },
            ]}
            style={styles.segmented}
          />

          <TextInput
            label="Nombre completo"
            value={form.name}
            onChangeText={v => setForm(f => ({ ...f, name: v }))}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Correo electrónico"
            value={form.email}
            onChangeText={v => setForm(f => ({ ...f, email: v }))}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            label="Teléfono"
            value={form.phone}
            onChangeText={v => setForm(f => ({ ...f, phone: v }))}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
          />
          <TextInput
            label="Contraseña"
            value={form.password}
            onChangeText={v => setForm(f => ({ ...f, password: v }))}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />

          {error ? <HelperText type="error" visible={!!error}>{error}</HelperText> : null}

          <Button 
            mode="contained" 
            onPress={handleRegister} 
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Registrarse
          </Button>

          <Button 
            mode="text" 
            onPress={() => navigation.navigate('Login')}
            style={styles.link}
          >
            ¿Ya tienes cuenta? Inicia sesión
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
  },
  form: {
    width: '100%',
  },
  segmented: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 10,
    paddingVertical: 4,
  },
  link: {
    marginTop: 10,
  },
});
