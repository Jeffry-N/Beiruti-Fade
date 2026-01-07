import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, useColorScheme, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
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
  profileImage?: string;
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'completed'>('pending');
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
      <ExpoLinearGradient
        colors={isDark ? ['#1E1E1E', '#0F0F0F'] : ['#FFFFFF', '#F5F5F5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeftLogo}>
            <Image
              source={require('../assets/images/beiruti-logo.png')}
              style={styles.headerLogo}
            />
            <Text style={[styles.headerBrand, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>Beiruti Fade</Text>
          </View>
          <Pressable
            onPress={() => setMenuOpen(!menuOpen)}
            style={styles.userAvatarButton}
          >
            {user?.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.userAvatar}
              />
            ) : (
              <Image
                source={{ uri: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&size=55' }}
                style={styles.userAvatar}
              />
            )}
          </Pressable>
        </View>
      </ExpoLinearGradient>

      {menuOpen && (
        <>
          <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)} />
          <View style={[styles.menuDropdown, { backgroundColor: isDark ? '#0F0F0F' : '#FFFFFF', borderColor: theme.cardBorder, opacity: 1 }]} pointerEvents="auto">
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); router.push('/profile-edit' as any); }}>
              <Text style={[styles.menuItemText, { color: isDark ? '#FFFFFF' : theme.text }]}>Edit Profile</Text>
            </TouchableOpacity>
            <View style={[styles.menuDivider, { backgroundColor: isDark ? '#2A2A2A' : theme.cardBorder }]} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => { await AsyncStorage.removeItem('user'); setMenuOpen(false); router.replace('/' as any); }}
            >
              <Text style={[styles.menuItemText, { color: '#ED1C24' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Tabs */}
      <View style={styles.modernTabsContainer}>
        <TouchableOpacity style={[styles.modernTab, { backgroundColor: activeTab === 'pending' ? (isDark ? 'rgba(237, 28, 36, 0.25)' : 'rgba(237, 28, 36, 0.1)') : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]} onPress={() => setActiveTab('pending')}>
          <Text style={styles.tabEmoji}>⏳</Text>
          <Text style={[styles.modernTabText, { color: activeTab === 'pending' ? '#ED1C24' : isDark ? '#B0B0B0' : '#666' }]}>Pending</Text>
          {activeTab === 'pending' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modernTab, { backgroundColor: activeTab === 'confirmed' ? (isDark ? 'rgba(237, 28, 36, 0.25)' : 'rgba(237, 28, 36, 0.1)') : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]} onPress={() => setActiveTab('confirmed')}>
          <Text style={styles.tabEmoji}>✅</Text>
          <Text style={[styles.modernTabText, { color: activeTab === 'confirmed' ? '#ED1C24' : isDark ? '#B0B0B0' : '#666' }]}>Confirmed</Text>
          {activeTab === 'confirmed' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modernTab, { backgroundColor: activeTab === 'completed' ? (isDark ? 'rgba(237, 28, 36, 0.25)' : 'rgba(237, 28, 36, 0.1)') : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]} onPress={() => setActiveTab('completed')}>
          <Text style={styles.tabEmoji}>🎉</Text>
          <Text style={[styles.modernTabText, { color: activeTab === 'completed' ? '#ED1C24' : isDark ? '#B0B0B0' : '#666' }]}>Completed</Text>
          {activeTab === 'completed' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Pending Appointments Tab */}
      {activeTab === 'pending' && (
        <View style={styles.appointmentsContainer}>
          {getPendingAppointments().length === 0 ? (
            <View style={[styles.emptyStateCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Pending Appointments</Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.subtext }]}>You're all caught up!</Text>
            </View>
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
      )}

      {/* Confirmed Appointments Tab */}
      {activeTab === 'confirmed' && (
        <View style={styles.appointmentsContainer}>
          {getConfirmedAppointments().length === 0 ? (
            <View style={[styles.emptyStateCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Confirmed Appointments</Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.subtext }]}>Accept requests to see them here</Text>
            </View>
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
      )}

      {/* Completed Appointments Tab */}
      {activeTab === 'completed' && (
        <View style={styles.appointmentsContainer}>
          {getCompletedByDate().length === 0 ? (
            <View style={[styles.emptyStateCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Completed Appointments</Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.subtext }]}>Complete appointments to see history</Text>
            </View>
          ) : (
            getCompletedByDate().map(({ date, appointments }) => (
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
            ))
          )}
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
    paddingTop: 40,
    paddingBottom: 25,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeftLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerLogo: {
    width: 60,
    height: 60,
  },
  headerBrand: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userAvatarButton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    overflow: 'hidden',
  },
  userAvatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuDropdown: {
    position: 'absolute',
    top: 60,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 150,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    zIndex: 1000,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 20,
  },
  greeting: {
    fontSize: 14,
    opacity: 0.8,
    fontWeight: '500',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 32,
  },
  modernTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    gap: 8,
  },
  modernTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
    position: 'relative',
  },
  modernTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  tabEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: '#ED1C24',
    borderRadius: 2,
  },
  appointmentsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyStateCard: {
    marginTop: 40,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: 'transparent',
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 15,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA000',
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
    backgroundColor: '#FFA000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
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
