import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookAppointment, updateAppointmentDate } from '../api';

export default function ConfirmationScreen() {
  const router = useRouter();
  const { serviceIds, barberId, date, time, serviceName, barberName, totalPrice, appointmentIds, reschedule } = useLocalSearchParams();
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
    
    try {
      // If this is a reschedule, update the existing appointment(s)
      if (reschedule === 'true' && appointmentIds) {
        const appointmentIdArray = String(appointmentIds).split(',').map(id => Number(id));
        
        // Update all appointments in the group
        for (const aptId of appointmentIdArray) {
          const result = await updateAppointmentDate(
            aptId,
            String(date),
            String(time)
          );
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to reschedule appointment');
          }
        }
        
        setIsLoading(false);
        Alert.alert('Success', 'Appointment rescheduled successfully!', [
          {
            text: 'OK',
            onPress: () => router.replace('/appointments' as any),
          },
        ]);
      } else {
        // Otherwise, book new appointments
        const serviceIdArray = String(serviceIds).split(',').map(id => Number(id));
        
        // Book all services sequentially
        for (const serviceId of serviceIdArray) {
          const result = await bookAppointment(
            user.id,
            Number(barberId),
            serviceId,
            String(date),
            String(time)
          );
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to book one or more services');
          }
        }
        
        setIsLoading(false);
        Alert.alert('Success', `${serviceIdArray.length} appointment${serviceIdArray.length > 1 ? 's' : ''} booked successfully!`, [
          {
            text: 'OK',
            onPress: () => router.replace('/home' as any),
          },
        ]);
      }
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Error', error.message || 'Failed to process appointment');
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

          {totalPrice && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Price</Text>
                <Text style={[styles.detailValue, {fontSize: 18, fontWeight: 'bold'}]}>${totalPrice}</Text>
              </View>
            </>
          )}
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
              <ActivityIndicator size="small" color="#FFFFFF" />
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
    backgroundColor: '#FFFFFF',
    padding: 16,
    justifyContent: 'center',
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: '#00A651',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  title: {
    color: '#1A1A1A',
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
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  detailValue: {
    color: '#00A651',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '50%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  editButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#00A651',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#00A651',
    fontWeight: 'bold',
    fontSize: 14,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#ED1C24',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#ED1C24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  disclaimer: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
