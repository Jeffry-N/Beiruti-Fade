import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBarberAppointments, updateAppointmentStatus } from '../api';

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
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAppointments = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser: User = JSON.parse(userData);
        setUser(parsedUser);

        const result = await getBarberAppointments(parsedUser.id);
        if (result.success && Array.isArray(result.data)) {
          setAppointments(result.data as Appointment[]);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load appointments');
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

  const handleAccept = async (appointmentId: number) => {
    Alert.alert('Accept Appointment', 'Mark this as confirmed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            const result = await updateAppointmentStatus(appointmentId, 'confirmed');
            if (result.success) {
              Alert.alert('Success', 'Appointment confirmed!');
              loadAppointments();
            } else {
              Alert.alert('Error', result.error || 'Failed to update appointment');
            }
          } catch (error) {
            Alert.alert('Error', 'Network error. Please try again.');
          }
        },
      },
    ]);
  };

  const handleReject = async (appointmentId: number) => {
    Alert.alert('Cancel Appointment', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await updateAppointmentStatus(appointmentId, 'cancelled');
            if (result.success) {
              Alert.alert('Success', 'Appointment cancelled');
              loadAppointments();
            } else {
              Alert.alert('Error', result.error || 'Failed to update appointment');
            }
          } catch (error) {
            Alert.alert('Error', 'Network error. Please try again.');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#CCFF00" />
      </View>
    );
  }

  const pendingCount = getPendingAppointments().length;
  const confirmedCount = getConfirmedAppointments().length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome Barber</Text>
          <Text style={styles.userName}>{user?.name || 'Barber'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => {}}
        >
          <Text style={styles.menuDots}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{confirmedCount}</Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
      </View>

      {/* Pending Appointments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Pending Appointments</Text>
        {getPendingAppointments().length === 0 ? (
          <Text style={styles.emptyText}>No pending appointments</Text>
        ) : (
          getPendingAppointments().map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <Text style={styles.serviceName}>{appointment.serviceName}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>PENDING</Text>
                </View>
              </View>

              <View style={styles.appointmentDetails}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>
                  {formatDate(appointment.date)} at {appointment.time}
                </Text>
              </View>

              <View style={styles.appointmentActions}>
                <TouchableOpacity 
                  style={styles.acceptButton}
                  onPress={() => handleAccept(appointment.id)}
                >
                  <Text style={styles.acceptButtonText}>✓ Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.rejectButton}
                  onPress={() => handleReject(appointment.id)}
                >
                  <Text style={styles.rejectButtonText}>✕ Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Confirmed Appointments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✅ Confirmed Appointments</Text>
        {getConfirmedAppointments().length === 0 ? (
          <Text style={styles.emptyText}>No confirmed appointments</Text>
        ) : (
          getConfirmedAppointments().map((appointment) => (
            <View key={appointment.id} style={[styles.appointmentCard, styles.confirmedCard]}>
              <View style={styles.appointmentHeader}>
                <Text style={styles.serviceName}>{appointment.serviceName}</Text>
                <View style={[styles.statusBadge, styles.confirmedBadge]}>
                  <Text style={styles.confirmedStatusText}>CONFIRMED</Text>
                </View>
              </View>

              <View style={styles.appointmentDetails}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>
                  {formatDate(appointment.date)} at {appointment.time}
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.completeButton}
                onPress={async () => {
                  Alert.alert('Complete', 'Mark appointment as completed?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Complete',
                      onPress: async () => {
                        try {
                          const result = await updateAppointmentStatus(appointment.id, 'completed');
                          if (result.success) {
                            Alert.alert('Done', 'Appointment marked as completed');
                            loadAppointments();
                          } else {
                            Alert.alert('Error', result.error || 'Failed to update appointment');
                          }
                        } catch (error) {
                          Alert.alert('Error', 'Network error. Please try again.');
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

      {/* Logout */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
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
    color: '#CCFF00',
    fontSize: 14,
    fontWeight: '600',
  },
  userName: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  menuButton: {
    padding: 8,
  },
  menuDots: {
    color: '#FFF',
    fontSize: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#CCFF00',
  },
  statNumber: {
    color: '#CCFF00',
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  appointmentCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB800',
  },
  confirmedCard: {
    borderLeftColor: '#00D084',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    color: '#CCFF00',
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
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#00D084',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#000',
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
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  completeButton: {
    backgroundColor: '#CCFF00',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#CCFF00',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#CCFF00',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
