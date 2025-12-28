import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signup } from '../api';

export default function SignupScreen() {
  const router = useRouter();
  
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isBarber, setIsBarber] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const type = isBarber ? 'barber' : 'customer';
    const result = await signup(fullName, username, email, password, type);

    setIsLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Account created! Please log in.', [
        {
          text: 'OK',
          onPress: () => router.replace('/'),
        },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Signup failed');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>JOIN THE FAMILY</Text>
        <Text style={styles.subtitle}>Create an account for Beiruti Fade</Text>
      </View>

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
          style={styles.roleSelector} 
          onPress={() => setIsBarber(!isBarber)}
          disabled={isLoading}
        >
          <Text style={styles.roleText}>
            Sign up as: <Text style={{color: '#CCFF00'}}>{isBarber ? 'BARBER' : 'CUSTOMER'}</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 30,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    color: '#CCFF00',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'left',
  },
  subtitle: {
    color: '#888',
    fontSize: 16,
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#1A1A1A',
    color: '#FFF',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  roleSelector: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 10,
  },
  roleText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#CCFF00',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 18,
  },
  linkText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
  },
  limeText: {
    color: '#CCFF00',
    fontWeight: 'bold',
  },
});