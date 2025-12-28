import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, useColorScheme } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAppointments } from '../api';
import ThemeModal from '../components/ThemeModal';
import { useThemeAlert } from '../hooks/useThemeAlert';

interface Appointment {
  id: number;
  barberName: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
  allAppointments?: Appointment[];
}

export default function AppointmentsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = {
    bg: isDark ? '#1A1A1A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    cardBg: isDark ? '#2A2A2A' : '#F5F5F5',
    cardBorder: isDark ? '#3A3A3A' : '#E0E0E0',
    subtext: isDark ? '#AAA' : '#666',
  };
  
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
    const { visible, config, hide, alert } = useThemeAlert();

  const loadAppointments = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        const result = await getAppointments(parsedUser.id);
        if (result.success && Array.isArray(result.data)) {
          // Filter out cancelled appointments
          const activeAppointments = (result.data as Appointment[]).filter(
            apt => apt.status !== 'cancelled' && apt.status !== 'completed'
          );
          
          // Group appointments by barber, date, and time
          const appointmentMap = new Map<string, any>();
          
          activeAppointments.forEach((apt) => {
            const key = `${apt.barberName}-${apt.date}-${apt.time}`;
            
            if (appointmentMap.has(key)) {
              // Merge service names
              const existing = appointmentMap.get(key);
              existing.serviceName = existing.serviceName + ', ' + apt.serviceName;
              existing.allAppointments = [...(existing.allAppointments || [apt]), apt];
            } else {
              appointmentMap.set(key, {
                ...apt,
                allAppointments: [apt]
              });
            }
          });
          
          setAppointments(Array.from(appointmentMap.values()));
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading appointments:', error);
      alert('Error', 'Failed to load appointments');
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      loadAppointments();
    }, [])
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#CCFF00';
      case 'pending':
        return '#FFB800';
      case 'completed':
        return '#00D084';
      case 'cancelled':
        return '#FF4444';
      default:
        return '#888';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color="#ED1C24" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>My Appointments</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Appointments List */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.listContainer}>
        {appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.subtext }]}>No appointments yet</Text>
            <TouchableOpacity 
              style={styles.bookButton}
              onPress={() => router.push('/booking' as any)}
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          appointments.map((appointment) => (
            <View key={appointment.id} style={[styles.appointmentCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <View style={styles.appointmentHeader}>
                <Text style={styles.barberName}>{appointment.barberName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                  <Text style={[
                    styles.statusText,
                    { color: appointment.status === 'pending' ? '#000' : '#FFF' }
                  ]}>
                    {appointment.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.appointmentDetails}>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: theme.subtext }]}>Service</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{appointment.serviceName}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: theme.subtext }]}>Date & Time</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {formatDate(appointment.date)} at {appointment.time}
                  </Text>
                </View>
              </View>

              <View style={styles.appointmentActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    // Get all appointment IDs from grouped appointments
                    const allIds = appointment.allAppointments 
                      ? appointment.allAppointments.map(apt => apt.id).join(',')
                      : appointment.id.toString();
                    
                    router.push({
                      pathname: '/booking',
                      params: { 
                        appointmentIds: allIds,
                        reschedule: 'true',
                        barberId: appointment.barberName,
                        date: appointment.date,
                        time: appointment.time
                      }
                    } as any);
                  }}
                >
                  <Text style={styles.actionButtonText}>Reschedule</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => {
                    alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
                      { text: 'No', style: 'cancel', onPress: () => {} },
                      {
                        text: 'Yes, Cancel',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            const { updateAppointmentStatus } = require('../api');
                            
                            // Cancel all appointments in the group (all services)
                            const appointmentsToCancel = appointment.allAppointments || [appointment];
                            
                            for (const apt of appointmentsToCancel) {
                              const result = await updateAppointmentStatus(apt.id, 'cancelled');
                              if (!result.success) {
                                throw new Error(result.error || 'Failed to cancel appointment');
                              }
                            }
                            
                            alert('Success', 'Appointment cancelled');
                            loadAppointments();
                          } catch (error: any) {
                            alert('Error', error.message || 'Network error. Please try again.');
                          }
                        },
                      },
                    ]);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      <ThemeModal
        visible={visible}
        title={config.title}
        message={config.message}
        buttons={config.buttons}
        onDismiss={hide}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
  },
  backText: {
    color: '#00A651',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 20,
  },
  bookButton: {
    backgroundColor: '#ED1C24',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#ED1C24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  appointmentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  barberName: {
    color: '#ED1C24',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  appointmentDetails: {
    marginBottom: 16,
  },
  detailItem: {
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#00A651',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  cancelButtonText: {
    color: '#FF4444',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
