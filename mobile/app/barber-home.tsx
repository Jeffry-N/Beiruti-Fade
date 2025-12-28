import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, useColorScheme } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAppointments, updateAppointmentStatus } from '../api';
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
    bg: isDark ? '#1A1A1A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    cardBg: isDark ? '#2A2A2A' : '#F5F5F5',
    cardBorder: isDark ? '#3A3A3A' : '#E0E0E0',
    subtext: isDark ? '#AAA' : '#666',
  };
  
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { visible, config, hide, alert } = useThemeAlert();

  const loadAppointments = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser: User = JSON.parse(userData);
        setUser(parsedUser);

        const result = await getAppointments(parsedUser.id);
        if (result.success && Array.isArray(result.data)) {
          setAppointments(result.data as Appointment[]);
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

  const getPendingAppointments = () => appointments.filter(a => a.status === 'pending');
  const getConfirmedAppointments = () => appointments.filter(a => a.status === 'confirmed');
  const getCompletedAppointments = () => appointments.filter(a => a.status === 'completed');

  const handleAccept = (appointmentId: number) => {
    alert('Accept Appointment', 'Mark this as confirmed?', [
      { text: 'Cancel', style: 'cancel', onPress: () => {} },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            const result = await updateAppointmentStatus(appointmentId, 'confirmed');
            if (result.success) {
              alert('Success', 'Appointment confirmed!');
              loadAppointments();
            } else {
              alert('Error', result.error || 'Failed to update appointment');
            }
          } catch (error) {
            alert('Error', 'Network error. Please try again.');
          }
        },
      },
    ]);
  };

  const handleReject = (appointmentId: number) => {
    alert('Cancel Appointment', 'Are you sure?', [
      { text: 'No', style: 'cancel', onPress: () => {} },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await updateAppointmentStatus(appointmentId, 'cancelled');
            if (result.success) {
              alert('Success', 'Appointment cancelled');
              loadAppointments();
            } else {
              alert('Error', result.error || 'Failed to update appointment');
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: '#00A651' }]}>Welcome back</Text>
          <Text style={[styles.userName, { color: theme.text }]}>{user?.name || 'Barber'}</Text>
          <TouchableOpacity onPress={() => router.push('/profile-edit' as any)}>
            <Text style={styles.editLink}>✎ Edit Profile</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.logoutButtonHeader}
          onPress={handleLogout}
        >
          <Text style={styles.logoutTextHeader}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.statNumber, { color: '#ED1C24' }]}>{pendingCount}</Text>
          <Text style={[styles.statLabel, { color: theme.subtext }]}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.statNumber, { color: '#ED1C24' }]}>{confirmedCount}</Text>
          <Text style={[styles.statLabel, { color: theme.subtext }]}>Confirmed</Text>
        </View>
      </View>

      {/* Pending Appointments */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Pending Appointments</Text>
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
                  onPress={() => handleAccept(appointment.id)}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.rejectButton}
                  onPress={() => handleReject(appointment.id)}
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
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Confirmed Appointments</Text>
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
                          const result = await updateAppointmentStatus(appointment.id, 'completed');
                          if (result.success) {
                            alert('Done', 'Appointment marked as completed');
                            loadAppointments();
                          } else {
                            alert('Error', result.error || 'Failed to update appointment');
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
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 20,
  },
  greeting: {
    color: '#00A651',
    fontSize: 14,
    fontWeight: '600',
  },
  userName: {
    color: '#1A1A1A',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  editLink: {
    color: '#00A651',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  logoutButtonHeader: {
    backgroundColor: '#ED1C24',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  logoutTextHeader: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
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
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#ED1C24',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statNumber: {
    color: '#ED1C24',
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  appointmentCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB800',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  confirmedCard: {
    borderLeftColor: '#00A651',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    color: '#ED1C24',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: '#FFB800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confirmedBadge: {
    backgroundColor: '#00D084',
  },
  statusText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  confirmedStatusText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  appointmentDetails: {
    marginBottom: 12,
  },
  detailLabel: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '500',
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#00A651',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  completeButton: {
    backgroundColor: '#ED1C24',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
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
});
