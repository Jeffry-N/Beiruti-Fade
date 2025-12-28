import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, useColorScheme, KeyboardAvoidingView, Platform, ScrollView, ToastAndroid } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateProfile, getProfile } from '../api';
import ThemeModal from '../components/ThemeModal';
import { useThemeAlert } from '../hooks/useThemeAlert';

interface User {
  id: number;
  name: string;
  type: 'customer' | 'barber';
}

export default function ProfileEditScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = {
    bg: isDark ? '#1A1A1A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    input: isDark ? '#2A2A2A' : '#F5F5F5',
    inputBorder: isDark ? '#3A3A3A' : '#E0E0E0',
    placeholder: isDark ? '#888' : '#666',
    subtext: isDark ? '#AAA' : '#666',
  };

  const router = useRouter();
  const { visible, config, hide, alert } = useThemeAlert();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    (async () => {
      const data = await AsyncStorage.getItem('user');
      if (data) {
        const parsed: User = JSON.parse(data);
        setUser(parsed);
        setFullName(parsed.name || '');
        // Fetch server-side email (and name for latest) for prefill
        const res = await getProfile(parsed.id, parsed.type);
        if (res.success && res.data) {
          const info: any = res.data;
          if (info.name) setFullName(info.name);
          if (info.email) setEmail(info.email);
          if (info.username) setUsername(info.username);
          if (info.bio) setBio(info.bio);
        }
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setEmailError('');
    setPasswordError('');
    setNameError('');

    if (!fullName.trim() && !email.trim() && !password.trim() && !(user.type === 'barber' && bio.trim())) {
      const msg = 'Please change at least one field.';
      if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT); else alert('Nothing to update', msg);
      return;
    }

    // Validate inputs only if provided
    let hasError = false;
    if (fullName.trim() && fullName.trim().length < 2) {
      setNameError('Full name must be at least 2 characters.');
      hasError = true;
    }
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError('Please enter a valid email address.');
        hasError = true;
      }
    }
    if (password.trim() && password.trim().length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      hasError = true;
    }
    if (hasError) {
      const msg = 'Please fix the highlighted fields.';
      if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT); else alert('Invalid input', msg);
      return;
    }
    setSaving(true);
    const res = await updateProfile(user.id, user.type, {
      fullName: fullName.trim() || undefined,
      email: email.trim() || undefined,
      password: password.trim() || undefined,
      bio: user.type === 'barber' ? (bio.trim() || undefined) : undefined,
    });
    setSaving(false);

    if (res.success) {
      // Update local storage name if changed
      if (fullName.trim()) {
        const updated: User = { ...user, name: fullName.trim() };
        await AsyncStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
      }
      const successNav = () => {
        if (user.type === 'barber') router.replace('/barber-home' as any);
        else router.replace('/home' as any);
      };
      if (Platform.OS === 'android') {
        ToastAndroid.show('Profile updated', ToastAndroid.SHORT);
        successNav();
      } else {
        alert('Updated', 'Your profile has been updated successfully.', [
          { text: 'OK', onPress: successNav }
        ]);
      }
    } else {
      alert('Error', res.error || 'Failed to update profile');
    }
  };

  return (
    <>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1}}>
      <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{padding:16}}>
        <Text style={[styles.title, { color: theme.text }]}>Edit Profile</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>Update your name, email, or password.</Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.subtext }]}>Full Name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter full name"
            placeholderTextColor={theme.placeholder}
            style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.inputBorder }]}
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.subtext }]}>Username (read-only)</Text>
          <TextInput
            value={username}
            editable={false}
            placeholderTextColor={theme.placeholder}
            style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.inputBorder, opacity: 0.7 }]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.subtext }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email"
            keyboardType="email-address"
            placeholderTextColor={theme.placeholder}
            style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.inputBorder }]}
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.subtext }]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter new password"
            secureTextEntry
            placeholderTextColor={theme.placeholder}
            style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.inputBorder }]}
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          {!passwordError ? (
            <Text style={[styles.hintText, { color: theme.subtext }]}>Leave blank to keep your current password</Text>
          ) : null}
        </View>

        {user?.type === 'barber' && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.subtext }]}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell customers about your experience, specialties, and style"
              placeholderTextColor={theme.placeholder}
              style={[styles.textarea, { backgroundColor: theme.input, color: theme.text, borderColor: theme.inputBorder }]}
              multiline
              numberOfLines={5}
            />
          </View>
        )}

        <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving || !user}>
          {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>

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
  container: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800', marginTop: 10 },
  subtitle: { fontSize: 12, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, marginBottom: 6, fontWeight: '600' },
  input: { padding: 14, borderRadius: 8, borderWidth: 1, fontSize: 14 },
  textarea: { padding: 14, borderRadius: 8, borderWidth: 1, fontSize: 14, minHeight: 120, textAlignVertical: 'top' },
  errorText: { color: '#FF4D4F', fontSize: 11, marginTop: 6 },
  hintText: { fontSize: 11, marginTop: 6 },
  saveButton: { backgroundColor: '#ED1C24', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  cancelButton: { borderWidth: 2, borderColor: '#ED1C24', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  cancelButtonText: { color: '#ED1C24', fontWeight: 'bold', fontSize: 14 },
});
