import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signup } from '../api';
import ThemeModal from '../components/ThemeModal';
import { useThemeAlert } from '../hooks/useThemeAlert';

export default function SignupScreen() {
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
  
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isBarber = false; // Only customers can sign up
  const [isLoading, setIsLoading] = useState(false);
  const { visible, config, hide, alert } = useThemeAlert();

  const handleSignup = async () => {
    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const type = isBarber ? 'barber' : 'customer';
    const result = await signup(fullName, username, email, password, type);

    setIsLoading(false);

    if (result.success) {
        alert('Success', 'Account created! Please log in.', [
        {
          text: 'OK',
          onPress: () => router.replace('/'),
        },
      ]);
    } else {
        alert('Error', result.error || 'Signup failed');
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

      <Text style={styles.signupTitle}>Create Your Account</Text>

      <View style={styles.form}>
        <TextInput 
          placeholder="Full Name" 
          placeholderTextColor="#666" 
          style={styles.input} 
          onChangeText={setFullName}
          value={fullName}
          editable={!isLoading}
          autoCorrect={false}
        />
        <TextInput 
          placeholder="Email" 
          placeholderTextColor="#666" 
          style={styles.input}
          keyboardType="email-address"
          onChangeText={setEmail}
          value={email}
          editable={!isLoading}
          autoCapitalize="none"
        />
        <TextInput 
          placeholder="Username" 
          placeholderTextColor="#666" 
          style={styles.input} 
          autoCapitalize="none"
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

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>REGISTER NOW</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push('/')} disabled={isLoading}>
        <Text style={styles.linkText}>
          Already have an account? <Text style={styles.limeText}>Sign In</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 30,
    justifyContent: 'center',
  },
  logoContainer: { 
    alignItems: 'center', 
    marginBottom: 30 
  },
  logoIconBox: {
    width: 70,
    height: 70,
    backgroundColor: '#ED1C24',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#ED1C24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 35,
  },
  logoText: { 
    color: '#ED1C24', 
    fontSize: 30, 
    fontWeight: '900', 
    letterSpacing: 2,
    textAlign: 'center' 
  },
  logoTextSecondary: { 
    color: '#00A651', 
    fontSize: 26, 
    fontWeight: '700', 
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: -5,
  },
  signupTitle: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 25,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    color: '#ED1C24',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'left',
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#F5F5F5',
    color: '#1A1A1A',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  roleSelector: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 10,
  },
  roleText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#ED1C24',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#ED1C24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  linkText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
  },
  limeText: {
    color: '#00A651',
    fontWeight: 'bold',
  },
});