import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Title, HelperText, useTheme } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor complete todos los campos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login({ email, password });
      await login(res);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
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
          <Text style={styles.logo}>🔗</Text>
          <Title style={styles.title}>ServiLink</Title>
          <Text style={styles.subtitle}>Servicios domésticos · Lima, Perú</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />

          {error ? <HelperText type="error" visible={!!error}>{error}</HelperText> : null}

          <Button 
            mode="contained" 
            onPress={handleLogin} 
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Iniciar Sesión
          </Button>

          <Button 
            mode="text" 
            onPress={() => navigation.navigate('Register')}
            style={styles.link}
          >
            ¿No tienes cuenta? Regístrate
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
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
  },
  form: {
    width: '100%',
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
