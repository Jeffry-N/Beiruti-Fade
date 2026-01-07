import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, useColorScheme } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAppointments } from '../api';
import ThemeModal from '../components/ThemeModal';
import { useThemeAlert } from '../hooks/useThemeAlert';

interface Appointment {
  id: number;
  barberId: number;
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
    bg: isDark ? '#0F0F0F' : '#F8F9FA',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    cardBg: isDark ? '#1E1E1E' : '#FFFFFF',
    cardBorder: isDark ? '#2A2A2A' : '#E8E8E8',
    subtext: isDark ? '#B0B0B0' : '#6B7280',
  };
  
  const router = useRouter();
  const [activeAppointments, setActiveAppointments] = useState<Appointment[]>([]);
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([]);
  const [cancelledAppointments, setCancelledAppointments] = useState<Appointment[]>([]);
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
          const raw = result.data as any[];
          
          // Separate appointments by status
          const active = raw.filter(apt => apt.status === 'pending' || apt.status === 'confirmed');
          const completed = raw.filter(apt => apt.status === 'completed');
          const cancelled = raw.filter(apt => apt.status === 'cancelled');
          
          // Process active appointments
          const activeMap = new Map<string, Appointment>();
          for (const apt of active) {
            const key = `${apt.barberId}-${apt.date}-${apt.time}-${apt.status}`;
            const item: Appointment = {
              id: apt.id,
              barberId: Number(apt.barberId || 0),
              barberName: apt.barberName,
              serviceName: apt.serviceName,
              date: apt.date,
              time: apt.time,
              status: apt.status,
              allAppointments: [{
                id: apt.id,
                barberId: Number(apt.barberId || 0),
                barberName: apt.barberName,
                serviceName: apt.serviceName,
                date: apt.date,
                time: apt.time,
                status: apt.status,
              } as Appointment]
            };
            if (activeMap.has(key)) {
              const existing = activeMap.get(key)!;
              const names = new Set((existing.serviceName + ', ' + item.serviceName).split(', ').filter(Boolean));
              existing.serviceName = Array.from(names).join(', ');
              existing.allAppointments = [
                ...(existing.allAppointments || []),
                ...item.allAppointments!
              ];
            } else {
              activeMap.set(key, item);
            }
          }
          
          // Process completed appointments (group similarly)
          const completedMap = new Map<string, Appointment>();
          for (const apt of completed) {
            const key = `${apt.barberId}-${apt.date}-${apt.time}`;
            const item: Appointment = {
              id: apt.id,
              barberId: Number(apt.barberId || 0),
              barberName: apt.barberName,
              serviceName: apt.serviceName,
              date: apt.date,
              time: apt.time,
              status: apt.status,
            };
            if (completedMap.has(key)) {
              const existing = completedMap.get(key)!;
              const names = new Set((existing.serviceName + ', ' + item.serviceName).split(', ').filter(Boolean));
              existing.serviceName = Array.from(names).join(', ');
            } else {
              completedMap.set(key, item);
            }
          }
          
          // Process cancelled appointments (group similarly)
          const cancelledMap = new Map<string, Appointment>();
          for (const apt of cancelled) {
            const key = `${apt.barberId}-${apt.date}-${apt.time}`;
            const item: Appointment = {
              id: apt.id,
              barberId: Number(apt.barberId || 0),
              barberName: apt.barberName,
              serviceName: apt.serviceName,
              date: apt.date,
              time: apt.time,
              status: apt.status,
            };
            if (cancelledMap.has(key)) {
              const existing = cancelledMap.get(key)!;
              const names = new Set((existing.serviceName + ', ' + item.serviceName).split(', ').filter(Boolean));
              existing.serviceName = Array.from(names).join(', ');
            } else {
              cancelledMap.set(key, item);
            }
          }
          
          setActiveAppointments(Array.from(activeMap.values()));
          setCompletedAppointments(Array.from(completedMap.values()));
          setCancelledAppointments(Array.from(cancelledMap.values()));
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
        return '#00A651';
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
      {/* Modern Gradient Header */}
      <LinearGradient
        colors={isDark ? ['#1E1E1E', '#0F0F0F'] : ['#FFFFFF', '#F5F5F5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>← Back</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Appointments List */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.listContainer}>
        {/* Active Appointments */}
        {activeAppointments.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionTitleCard, { 
              backgroundColor: theme.cardBg,
              shadowColor: '#FF9500',
              shadowOpacity: isDark ? 0.5 : 0.2,
            }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Appointments</Text>
            </View>
            {activeAppointments.map((appointment) => (
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
                        barberId: String(appointment.barberId),
                        date: appointment.date,
                        time: appointment.time
                      }
                    } as any);
                  }}
                >
                  <Text style={styles.actionButtonText}>Reschedule</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton, { borderColor: isDark ? '#FF4444' : '#ED1C24' }]}
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
                  <Text style={[styles.cancelButtonText, { color: isDark ? '#FF4444' : '#ED1C24' }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          </View>
        )}
        
        {/* Completed Appointments */}
        {completedAppointments.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionTitleCard, { 
              backgroundColor: theme.cardBg,
              shadowColor: '#00A651',
              shadowOpacity: isDark ? 0.5 : 0.2,
            }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Completed Appointments</Text>
            </View>
            {completedAppointments.map((appointment) => (
              <View key={appointment.id} style={[styles.appointmentCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                <View style={styles.appointmentHeader}>
                  <Text style={styles.barberName}>{appointment.barberName}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                    <Text style={[styles.statusText, { color: '#FFFFFF' }]}>COMPLETED</Text>
                  </View>
                </View>
                <Text style={[styles.serviceText, { color: theme.text }]}>{appointment.serviceName}</Text>
                <Text style={[styles.dateText, { color: theme.subtext }]}>{formatDate(appointment.date)} • {appointment.time}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Cancelled Appointments */}
        {cancelledAppointments.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionTitleCard, { 
              backgroundColor: theme.cardBg,
              shadowColor: '#ED1C24',
              shadowOpacity: isDark ? 0.5 : 0.2,
            }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Cancelled Appointments</Text>
            </View>
            {cancelledAppointments.map((appointment) => (
              <View key={appointment.id} style={[styles.appointmentCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                <View style={styles.appointmentHeader}>
                  <Text style={styles.barberName}>{appointment.barberName}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                    <Text style={[styles.statusText, { color: '#FFFFFF' }]}>CANCELLED</Text>
                  </View>
                </View>
                <Text style={[styles.serviceText, { color: theme.text }]}>{appointment.serviceName}</Text>
                <Text style={[styles.dateText, { color: theme.subtext }]}>{formatDate(appointment.date)} • {appointment.time}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Empty state */}
        {activeAppointments.length === 0 && completedAppointments.length === 0 && cancelledAppointments.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.subtext }]}>No appointments yet</Text>
            <TouchableOpacity 
              style={styles.bookButton}
              onPress={() => router.push('/booking' as any)}
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
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
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitleCard: {
    marginHorizontal: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  appointmentCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  barberName: {
    color: '#ED1C24',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  appointmentDetails: {
    marginBottom: 16,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  actionButtonText: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: '#FFF5F5',
    borderColor: '#ED1C24',
  },
  cancelButtonText: {
    fontWeight: '700',
    color: '#ED1C24',
    fontSize: 13,
  },
  serviceText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 13,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 15,
    marginBottom: 12,
    fontWeight: '600',
  },
  bookButton: {
    backgroundColor: '#ED1C24',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#ED1C24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
