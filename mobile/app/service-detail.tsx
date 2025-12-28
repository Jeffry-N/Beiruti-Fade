import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export const options = {
  headerShown: false,
};

export default function ServiceDetailScreen() {
  const { id, name, description, price } = useLocalSearchParams<{ id: string; name: string; description: string; price: string }>();
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={[styles.contentContainer]}
    >
      <View style={styles.body}>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
            {price ? <Text style={styles.price}>${price}</Text> : null}
          </View>
          <Text style={[styles.description, { color: theme.text }]}>{description || 'No description available.'}</Text>
        </View>
      </View>

      <View style={styles.flexSpacer} />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { flexGrow: 1, padding: 16, justifyContent: 'center' },
  body: { alignItems: 'center', width: '100%', flex: 1, justifyContent: 'center' },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, width: '100%', maxWidth: 480 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 20, fontWeight: '800' },
  price: { color: '#ED1C24', fontSize: 16, fontWeight: '700' },
  description: { fontSize: 14, lineHeight: 20 },
  flexSpacer: { flex: 1 },
  backButton: { marginTop: 16, backgroundColor: '#ED1C24', paddingVertical: 14, borderRadius: 8, alignItems: 'center', alignSelf: 'center', width: '100%', maxWidth: 480 },
  backButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});
