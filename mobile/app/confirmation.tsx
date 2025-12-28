import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookAppointment } from '../api';

export default function ConfirmationScreen() {
  const router = useRouter();
  const { serviceId, barberId, date, time, serviceName, barberName } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  React.useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
    loadUser();
  }, []);

  const handleConfirm = async () => {
    if (!user) {
      Alert.alert('Error', 'User data not found');
      return;
    }

    setIsLoading(true);
    const result = await bookAppointment(
      user.id,
      Number(barberId),
      Number(serviceId),
      String(date),
      String(time)
    );

    setIsLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Appointment booked successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace('/home' as any),
        },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to book appointment');
    }
  };

  const handleEdit = () => {
    router.back();
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Confirmation Card */}
      <View style={styles.card}>
        <Text style={styles.title}>Booking Confirmation</Text>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>{serviceName}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Barber</Text>
            <Text style={styles.detailValue}>{barberName}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{date ? formatDate(String(date)) : 'Not selected'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{time}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEdit}
            disabled={isLoading}
          >
            <Text style={styles.editButtonText}>EDIT</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.confirmButtonText}>CONFIRM</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          Please arrive 5 minutes before your appointment time
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
    padding: 16,
    justifyContent: 'center',
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: '#CCFF00',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  detailsContainer: {
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  detailValue: {
    color: '#CCFF00',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '50%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#262641',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  editButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#CCFF00',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#CCFF00',
    fontWeight: 'bold',
    fontSize: 14,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#CCFF00',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  disclaimer: {
    color: '#888',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
