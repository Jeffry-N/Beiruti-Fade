import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../api';

interface LoginResponse {
  id: number;
  name: string;
  type: 'customer' | 'barber';
}

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isBarber, setIsBarber] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password');
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
      Alert.alert('Success', `Welcome back!`);
      
      // Route based on user type
      if (type === 'barber') {
        router.replace('/barber-home' as any);
      } else {
        router.replace('/home' as any);
      }
    } else {
      Alert.alert('Error', result.error || 'Invalid Credentials');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>BEIRUTI FADE</Text>
      
      <View style={styles.inputContainer}>
        <TextInput 
          placeholder="Username" 
          placeholderTextColor="#666" 
          style={styles.input} 
          onChangeText={setUsername}
          value={username}
          editable={!isLoading}
        />
        <TextInput 
          placeholder="Password" 
          placeholderTextColor="#666" 
          secureTextEntry 
          style={styles.input} 
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
        <Text style={styles.roleText}>
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
        <Text style={styles.linkText}>
          Don't have an account? <Text style={{color: '#00A651', fontWeight: '600'}}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', padding: 30 },
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