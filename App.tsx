import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <AppNavigator />
        <StatusBar style="auto" />
      </PaperProvider>
    </AuthProvider>
  );
}
