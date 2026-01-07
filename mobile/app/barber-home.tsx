import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, useColorScheme } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBarberAppointments, updateAppointmentStatus } from '../api';
import ThemeModal from '../components/ThemeModal';
import { useThemeAlert } from '../hooks/useThemeAlert';

interface Appointment {
  id: number;
  barberName: string;
  customerName?: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
  allAppointments?: Appointment[];
  // API currently returns `barberId` that actually contains CustomerId for barber queries
  // We'll accept an optional field to help grouping without backend change
  customerId?: number;
}
interface User {
  id: number;
  name: string;
  type: 'barber' | 'customer';
}

export default function BarberHomeScreen() {
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
  const [user, setUser] = useState<User | null>(null);
  const [activeAppointments, setActiveAppointments] = useState<Appointment[]>([]);
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { visible, config, hide, alert } = useThemeAlert();

  const loadAppointments = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser: User = JSON.parse(userData);
        setUser(parsedUser);

          const result = await getBarberAppointments(parsedUser.id);
          if (result.success && Array.isArray(result.data)) {
            const raw = result.data as any[];
            // Separate active and completed appointments
            const active = raw.filter((item) => item.status === 'pending' || item.status === 'confirmed');
            const completed = raw.filter((item) => item.status === 'completed');
            
            // Group active appointments by customerId + date + time + status
            const activeMap = new Map<string, Appointment>();
            for (const item of active) {
              const customerId = Number(item.customerId || 0);
              const key = `${customerId}-${item.date}-${item.time}-${item.status}`;
              const apt: Appointment = {
                id: item.id,
                barberName: item.barberName,
                customerName: item.customerName,
                serviceName: item.serviceName,
                date: item.date,
                time: item.time,
                status: item.status,
                customerId,
              };
              if (activeMap.has(key)) {
                const existing = activeMap.get(key)!;
                existing.serviceName = existing.serviceName + ', ' + apt.serviceName;
                existing.allAppointments = [...(existing.allAppointments || [existing]), apt];
                const statuses = new Set([existing.status, apt.status]);
                if (statuses.has('pending')) existing.status = 'pending';
                else if (statuses.has('confirmed')) existing.status = 'confirmed';
              } else {
                activeMap.set(key, { ...apt, allAppointments: [apt] });
              }
            }
            
            // Group completed appointments by customerId + date + time
            const completedMap = new Map<string, Appointment>();
            for (const item of completed) {
              const customerId = Number(item.customerId || 0);
              const key = `${customerId}-${item.date}-${item.time}`;
              const apt: Appointment = {
                id: item.id,
                barberName: item.barberName,
                customerName: item.customerName,
                serviceName: item.serviceName,
                date: item.date,
                time: item.time,
                status: item.status,
                customerId,
              };
              if (completedMap.has(key)) {
                const existing = completedMap.get(key)!;
                existing.serviceName = existing.serviceName + ', ' + apt.serviceName;
              } else {
                completedMap.set(key, apt);
              }
            }
            
            // Sort completed appointments by date (most recent first)
            const completedArray = Array.from(completedMap.values()).sort((a, b) => {
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
            
            setActiveAppointments(Array.from(activeMap.values()));
            setCompletedAppointments(completedArray);
          }
      }
    } catch (error) {
      alert('Error', 'Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      loadAppointments();
    }, [])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    router.replace('/' as any);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getPendingAppointments = () => activeAppointments.filter(a => a.status === 'pending');
  const getConfirmedAppointments = () => activeAppointments.filter(a => a.status === 'confirmed');
  
  // Group completed appointments by date
  const getCompletedByDate = () => {
    const grouped = new Map<string, Appointment[]>();
    for (const apt of completedAppointments) {
      const date = apt.date;
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(apt);
    }
    return Array.from(grouped.entries()).map(([date, appts]) => ({ date, appointments: appts }));
  };

  const handleAccept = (appointmentId: number, group?: Appointment[]) => {
    alert('Accept Appointment', 'Mark this as confirmed?', [
      { text: 'Cancel', style: 'cancel', onPress: () => {} },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            const targets = group && group.length ? group : [{ id: appointmentId } as Appointment];
            for (const apt of targets) {
              const result = await updateAppointmentStatus(apt.id, 'confirmed');
              if (!result.success) throw new Error(result.error || 'Failed to update appointment');
            }
            {
              alert('Success', 'Appointment confirmed!');
              loadAppointments();
            }
          } catch (error) {
            alert('Error', 'Network error. Please try again.');
          }
        },
      },
    ]);
  };

  const handleReject = (appointmentId: number, group?: Appointment[]) => {
    alert('Cancel Appointment', 'Are you sure?', [
      { text: 'No', style: 'cancel', onPress: () => {} },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            const targets = group && group.length ? group : [{ id: appointmentId } as Appointment];
            for (const apt of targets) {
              const result = await updateAppointmentStatus(apt.id, 'cancelled');
              if (!result.success) throw new Error(result.error || 'Failed to update appointment');
            }
            {
              alert('Success', 'Appointment cancelled');
              loadAppointments();
            }
          } catch (error) {
            alert('Error', 'Network error. Please try again.');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ED1C24" />
      </View>
    );
  }

  const pendingCount = getPendingAppointments().length;
  const confirmedCount = getConfirmedAppointments().length;

  return (
    <>
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Modern Gradient Header */}
      <LinearGradient
        colors={isDark ? ['#1E1E1E', '#0F0F0F'] : ['#FFFFFF', '#F5F5F5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>Welcome back</Text>
            <Text style={[styles.userName, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>{user?.name || 'Barber'}</Text>
          </View>
          <Image 
            source={require('../assets/images/beiruti-logo.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>

      {/* Quick Actions Card */}
      <View style={styles.quickActionsWrapper}>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity 
            style={[styles.quickActionCard, {
              backgroundColor: theme.cardBg,
              shadowColor: '#00A651',
              shadowOpacity: isDark ? 0.5 : 0.2,
            }]}
            onPress={() => router.push('/profile-edit')}
          >
            <Text style={[styles.quickActionTitle, { color: theme.text }]}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickActionCard, {
              backgroundColor: theme.cardBg,
              shadowColor: '#ED1C24',
              shadowOpacity: isDark ? 0.5 : 0.2,
            }]}
            onPress={handleLogout}
          >
            <Text style={[styles.quickActionTitle, { color: theme.text }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modern Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, {
          backgroundColor: theme.cardBg,
          shadowColor: '#FF9500',
          shadowOpacity: isDark ? 0.5 : 0.2,
        }]}>
          <Text style={[styles.statNumber, { color: theme.text }]}>{pendingCount}</Text>
          <Text style={[styles.statLabel, { color: theme.text }]}>Pending</Text>
        </View>
        <View style={[styles.statCard, {
          backgroundColor: theme.cardBg,
          shadowColor: '#00A651',
          shadowOpacity: isDark ? 0.5 : 0.2,
        }]}>
          <Text style={[styles.statNumber, { color: theme.text }]}>{confirmedCount}</Text>
          <Text style={[styles.statLabel, { color: theme.text }]}>Confirmed</Text>
        </View>
      </View>

      {/* Pending Appointments */}
      <View style={styles.section}>
        <View style={[styles.sectionTitleCard, { 
          backgroundColor: theme.cardBg,
          shadowColor: '#FF9500',
          shadowOpacity: isDark ? 0.5 : 0.2,
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Pending Appointments</Text>
        </View>
        {getPendingAppointments().length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.subtext }]}>No pending appointments</Text>
        ) : (
          getPendingAppointments().map((appointment) => (
            <View key={appointment.id} style={[styles.appointmentCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <View style={styles.appointmentHeader}>
                <Text style={[styles.serviceName, { color: theme.text }]}>{appointment.serviceName}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>PENDING</Text>
                </View>
              </View>

              <View style={styles.appointmentDetails}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>Date & Time</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {formatDate(appointment.date)} at {appointment.time}
                </Text>
              </View>

              <View style={styles.appointmentActions}>
                <TouchableOpacity 
                  style={styles.acceptButton}
                  onPress={() => handleAccept(appointment.id, appointment.allAppointments)}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.rejectButton}
                  onPress={() => handleReject(appointment.id, appointment.allAppointments)}
                >
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Confirmed Appointments */}
      <View style={styles.section}>
        <View style={[styles.sectionTitleCard, { 
          backgroundColor: theme.cardBg,
          shadowColor: '#00A651',
          shadowOpacity: isDark ? 0.5 : 0.2,
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Confirmed Appointments</Text>
        </View>
        {getConfirmedAppointments().length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.subtext }]}>No confirmed appointments</Text>
        ) : (
          getConfirmedAppointments().map((appointment) => (
            <View key={appointment.id} style={[styles.appointmentCard, styles.confirmedCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <View style={styles.appointmentHeader}>
                <Text style={[styles.serviceName, { color: theme.text }]}>{appointment.serviceName}</Text>
                <View style={[styles.statusBadge, styles.confirmedBadge]}>
                  <Text style={styles.confirmedStatusText}>CONFIRMED</Text>
                </View>
              </View>

              <View style={styles.appointmentDetails}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>Date & Time</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {formatDate(appointment.date)} at {appointment.time}
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.completeButton}
                onPress={() => {
                  alert('Complete', 'Mark appointment as completed?', [
                    { text: 'Cancel', style: 'cancel', onPress: () => {} },
                    {
                      text: 'Complete',
                      onPress: async () => {
                        try {
                          const targets = appointment.allAppointments && appointment.allAppointments.length ? appointment.allAppointments : [appointment];
                          for (const apt of targets) {
                            const result = await updateAppointmentStatus(apt.id, 'completed');
                            if (!result.success) throw new Error(result.error || 'Failed to update appointment');
                          }
                          {
                            alert('Done', 'Appointment marked as completed');
                            loadAppointments();
                          }
                        } catch (error) {
                          alert('Error', 'Network error. Please try again.');
                        }
                      },
                    },
                  ]);
                }}
              >
                <Text style={styles.completeButtonText}>Mark as Completed</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Completed Appointments (Grouped by Date) */}
      {getCompletedByDate().length > 0 && (
        <View style={styles.section}>
          <View style={[styles.sectionTitleCard, { 
            backgroundColor: theme.cardBg,
            shadowColor: '#00A651',
            shadowOpacity: isDark ? 0.5 : 0.2,
          }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Completed Appointments</Text>
          </View>
          {getCompletedByDate().map(({ date, appointments }) => (
            <View key={date}>
              <Text style={[styles.dateHeader, { color: theme.subtext }]}>{formatDate(date)}</Text>
              {appointments.map((appointment) => (
                <View key={appointment.id} style={[styles.appointmentCard, styles.completedCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                  <View style={styles.appointmentHeader}>
                    <View>
                      <Text style={[styles.customerName, { color: theme.text }]}>{appointment.customerName}</Text>
                      <Text style={[styles.serviceText, { color: theme.subtext }]}>{appointment.serviceName}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#00D084' }]}>
                      <Text style={[styles.statusText, { color: '#FFFFFF' }]}>COMPLETED</Text>
                    </View>
                  </View>
                  <Text style={[styles.timeText, { color: theme.subtext }]}>{appointment.time}</Text>
                </View>
              ))}
            </View>
          ))}
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
    </>
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
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerLogo: {
    width: 60,
    height: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 20,
  },
  greeting: {
    fontSize: 16,
    opacity: 0.9,
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  editLink: {
    color: '#00A651',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  quickActionsWrapper: {
    padding: 20,
    gap: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
  },
  menuDots: {
    color: '#1A1A1A',
    fontSize: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
    opacity: 0.95,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitleCard: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateHeader: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 12,
    color: '#6B7280',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 40,
  },
  appointmentCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#FFB800',
  },
  confirmedCard: {
    borderLeftColor: '#00A651',
  },
  completedCard: {
    borderLeftColor: '#00A651',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceName: {
    color: '#ED1C24',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: '#FFB800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  confirmedBadge: {
    backgroundColor: '#00A651',
  },
  statusText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  confirmedStatusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  appointmentDetails: {
    marginBottom: 16,
  },
  detailLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '500',
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#00A651',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#00A651',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF4444',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  completeButton: {
    backgroundColor: '#ED1C24',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#ED1C24',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  logoutButton: {
    borderWidth: 2,
    borderColor: '#ED1C24',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ED1C24',
    fontWeight: 'bold',
    fontSize: 14,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceText: {
    fontSize: 12,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
  },
});
