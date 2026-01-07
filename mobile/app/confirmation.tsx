import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookAppointment, updateAppointmentDate } from '../api';
import ThemeModal from '../components/ThemeModal';
import { useThemeAlert } from '../hooks/useThemeAlert';

export default function ConfirmationScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = {
    bg: isDark ? '#1A1A1A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    cardBg: isDark ? '#2A2A2A' : '#F5F5F5',
    cardBorder: isDark ? '#3A3A3A' : '#E0E0E0',
    subtext: isDark ? '#AAA' : '#666',
    headerGradient: isDark ? ['#1E1E1E', '#0F0F0F'] : ['#FFFFFF', '#F5F5F5'],
  };
  
  const router = useRouter();
  const { serviceIds, barberId, date, time, serviceName, barberName, totalPrice, appointmentIds, reschedule } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const { visible, config, hide, alert } = useThemeAlert();
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
      alert('Error', 'User data not found');
      return;
    }

    setIsLoading(true);
    
    try {
      // If this is a reschedule, update the existing appointment(s)
      if (reschedule === 'true' && appointmentIds) {
        const appointmentIdArray = String(appointmentIds).split(',').map(id => Number(id));
        const serviceIdArray = String(serviceIds).split(',').map(id => Number(id));

        const { rescheduleAppointmentServices } = require('../api');
        const result = await rescheduleAppointmentServices(
          appointmentIdArray,
          user.id,
          Number(barberId),
          serviceIdArray,
          String(date),
          String(time)
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to reschedule appointment');
        }

        setIsLoading(false);
        alert('Success', 'Appointment rescheduled and awaiting barber confirmation', [
          {
            text: 'OK',
            onPress: () => router.replace('/home' as any),
          },
        ]);
      } else {
        // Otherwise, book new appointments
        const serviceIdArray = String(serviceIds).split(',').map(id => Number(id));
        
        // Book all selected services for the same slot; treated as one logical appointment
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
        alert('Success', 'Appointment booked successfully!', [
          {
            text: 'OK',
            onPress: () => router.replace('/home' as any),
          },
        ]);
      }
    } catch (error: any) {
      setIsLoading(false);
      alert('Error', error.message || 'Failed to process appointment');
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
    <>
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.headerGradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <TouchableOpacity onPress={() => {
          if (reschedule === 'true') {
            router.replace('/home' as any);
          } else {
            router.back();
          }
        }} style={styles.backButtonHeader}>
          <Text style={[styles.backButtonHeaderText, { color: theme.text }]}>← Back</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Confirmation Card */}
      <View style={styles.cardWrapper}>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.title, { color: theme.text }]}>Booking Confirmation</Text>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>Service</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{serviceName}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>Barber</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{barberName}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>Date</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{date ? formatDate(String(date)) : 'Not selected'}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>Time</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{time}</Text>
          </View>

          {totalPrice && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>Total Price</Text>
                <Text style={[styles.detailValue, { color: theme.text, fontSize: 18, fontWeight: 'bold' }]}>${totalPrice}</Text>
              </View>
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.editButtonWrapper}
            onPress={handleEdit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#00A651', '#008A43']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>EDIT</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.confirmButtonWrapper}
            onPress={handleConfirm}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ED1C24', '#C41018']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmButtonText}>CONFIRM</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          Please arrive 5 minutes before your appointment time
        </Text>
      </View>
      </View>
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
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  backButtonHeader: {
    alignSelf: 'flex-start',
  },
  backButtonHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardWrapper: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
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
    fontSize: 13,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '50%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  editButtonWrapper: {
    flex: 1,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  editButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  confirmButtonWrapper: {
    flex: 1,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  disclaimer: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
