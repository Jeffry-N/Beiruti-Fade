import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../api';
import ThemeModal from '../components/ThemeModal';
import { useThemeAlert } from '../hooks/useThemeAlert';

interface LoginResponse {
  id: number;
  name: string;
  type: 'customer' | 'barber';
}

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = {
    bg: isDark ? '#1A1A1A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    input: isDark ? '#2A2A2A' : '#F5F5F5',
    inputBorder: isDark ? '#3A3A3A' : '#E0E0E0',
    placeholder: isDark ? '#888' : '#666',
  };
  
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isBarber, setIsBarber] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { visible, config, hide, alert } = useThemeAlert();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      alert('Error', 'Please enter username and password');
      return;
    }

    setIsLoading(true);
    const type = isBarber ? 'barber' : 'customer';
    const result = await login(username, password, type);

    setIsLoading(false);

    if (result.success && result.data) {
      const userData: LoginResponse = { 
        ...(result.data as any), 
        type 
      };
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      alert('Success', `Welcome back!`);
      
      // Route based on user type
      if (type === 'barber') {
        router.replace('/barber-home' as any);
      } else {
        router.replace('/home' as any);
      }
    } else {
      alert('Error', result.error || 'Invalid Credentials');
    }
  };

  return (
    <>
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoIconBox}>
          <Text style={styles.logoIcon}>💈</Text>
        </View>
        <Text style={styles.logoText}>BEIRUTI</Text>
        <Text style={styles.logoTextSecondary}>FADE</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput 
          placeholder="Username" 
          placeholderTextColor={theme.placeholder} 
          style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.inputBorder }]} 
          onChangeText={setUsername}
          value={username}
          editable={!isLoading}
        />
        <TextInput 
          placeholder="Password" 
          placeholderTextColor={theme.placeholder} 
          secureTextEntry 
          style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.inputBorder }]} 
          onChangeText={setPassword}
          value={password}
          editable={!isLoading}
        />
      </View>

      <TouchableOpacity 
        style={styles.roleSelector} 
        onPress={() => setIsBarber(!isBarber)}
        disabled={isLoading}
      >
        <Text style={[styles.roleText, { color: theme.text }]}>
          Login as: <Text style={{color: '#00A651', fontWeight: '700'}}>{isBarber ? 'BARBER' : 'CUSTOMER'}</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>SIGN IN</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => router.push({ pathname: "/signup" } as any)}
        disabled={isLoading}
      >
        <Text style={[styles.linkText, { color: isDark ? '#AAA' : '#666' }]}>
          Don't have an account? <Text style={{color: '#00A651', fontWeight: '600'}}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>

    <ThemeModal
      visible={visible}
      title={config.title}
      message={config.message}
      buttons={config.buttons}
      onDismiss={hide}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', padding: 30 },
  logoContainer: { 
    alignItems: 'center', 
    marginBottom: 50 
  },
  logoIconBox: {
    width: 80,
    height: 80,
    backgroundColor: '#ED1C24',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#ED1C24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 40,
  },
  logoText: { 
    color: '#ED1C24', 
    fontSize: 36, 
    fontWeight: '900', 
    letterSpacing: 2,
    textAlign: 'center' 
  },
  logoTextSecondary: { 
    color: '#00A651', 
    fontSize: 32, 
    fontWeight: '700', 
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: -5,
  },
  logo: { color: '#ED1C24', fontSize: 36, fontWeight: '900', textAlign: 'center', marginBottom: 50 },
  inputContainer: { marginBottom: 20 },
  input: { backgroundColor: '#F5F5F5', color: '#1A1A1A', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  roleSelector: { alignItems: 'center', marginBottom: 25 },
  roleText: { color: '#1A1A1A', fontSize: 14, fontWeight: '600' },
  button: { backgroundColor: '#ED1C24', padding: 18, borderRadius: 8, alignItems: 'center', shadowColor: '#ED1C24', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  linkText: { color: '#666', textAlign: 'center', marginTop: 25, fontSize: 14 }
});