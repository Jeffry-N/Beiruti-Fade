import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getBarber } from '../api';

interface Barber {
  id: number;
  name: string;
  bio: string;
  email?: string;
}

export default function BarberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = {
    bg: isDark ? '#1A1A1A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    cardBg: isDark ? '#2A2A2A' : '#F5F5F5',
    cardBorder: isDark ? '#3A3A3A' : '#E0E0E0',
    subtext: isDark ? '#AAA' : '#666',
  };

  const [barber, setBarber] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const res = await getBarber(Number(id));
      if (res.success && res.data) {
        setBarber(res.data as any);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container]}>
        <ActivityIndicator size="large" color="#ED1C24" />
      </View>
    );
  }

  if (!barber) {
    return (
      <View style={[styles.container]}>
        <Text style={{ color: theme.text }}>Barber not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16 }}>
      <View style={[styles.header]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{barber.name?.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]}>{barber.name}</Text>
          {barber.email ? (
            <Text style={[styles.email, { color: theme.subtext }]}>{barber.email}</Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
        <Text style={[styles.bio, { color: theme.text }]}>{barber.bio || 'No bio provided.'}</Text>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#00A651', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 22 },
  name: { fontSize: 20, fontWeight: '800' },
  email: { fontSize: 12 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  bio: { fontSize: 14, lineHeight: 20 },
  backButton: { backgroundColor: '#ED1C24', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  backButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});
