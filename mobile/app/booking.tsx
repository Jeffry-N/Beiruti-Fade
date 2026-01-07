import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, useColorScheme, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBarbers, getServices, getAvailableTimes } from '../api';
import ThemeModal from '../components/ThemeModal';
import { useThemeAlert } from '../hooks/useThemeAlert';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

interface Barber {
  id: number;
  name: string;
  bio: string;
  imageUrl?: string;
}

export default function BookingScreen() {
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
  const { serviceId: initialServiceId, barberId: initialBarberId, appointmentIds, reschedule } = useLocalSearchParams();
  
  const [selectedServices, setSelectedServices] = useState<number[]>(
    initialServiceId ? [Number(initialServiceId)] : []
  );
  const [selectedBarber, setSelectedBarber] = useState<number | null>(
    initialBarberId ? Number(initialBarberId) : null
  );
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { visible, config, hide, alert } = useThemeAlert();
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Check if a time is in the past
  const isTimePast = (dateStr: string, timeStr: string): boolean => {
    const now = new Date();
    const [hours, mins] = timeStr.split(':').map(Number);
    const appointmentDateTime = new Date(dateStr + 'T' + timeStr + ':00');
    return appointmentDateTime <= now;
  };

  // Check if a time slot is available (not booked and not in the past)
  const isTimeAvailable = (timeStr: string): boolean => {
    return !bookedTimes.includes(timeStr) && !isTimePast(selectedDate, timeStr);
  };

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  // Generate next 30 days
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const dates = generateDates();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }

        const servicesResult = await getServices();
        if (servicesResult.success && Array.isArray(servicesResult.data)) {
          setServices(servicesResult.data as Service[]);
        }

        const barbersResult = await getBarbers();
        if (barbersResult.success && Array.isArray(barbersResult.data)) {
          setBarbers(barbersResult.data as Barber[]);
        }
      } catch (error) {
        alert('Error', 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Fetch available times whenever barber or date changes
  useEffect(() => {
    const fetchAvailableTimes = async () => {
      if (selectedBarber && selectedDate) {
        setLoadingAvailability(true);
        const result = await getAvailableTimes(selectedBarber, selectedDate);
        if (result.success && Array.isArray(result.data)) {
          const times = result.data as string[];
          setBookedTimes(times);
        } else {
          setBookedTimes([]);
        }
        setLoadingAvailability(false);
        // Clear selected time when date changes to prevent using old time from past date
        setSelectedTime('');
      } else {
        setBookedTimes([]);
      }
    };

    fetchAvailableTimes();
  }, [selectedBarber, selectedDate]);

  const handleConfirm = () => {
    if (selectedServices.length === 0 || !selectedBarber || !selectedDate || !selectedTime) {
      alert('Error', 'Please select at least one service, a barber, date, and time');
      return;
    }

    // Validate that the selected date is not in the past
    const now = new Date();
    const selectedDateTime = new Date(selectedDate + 'T' + selectedTime + ':00');
    if (selectedDateTime <= now) {
      alert('Error', 'Cannot book appointment in the past. Please select a future date and time.');
      return;
    }

    const selectedServiceNames = selectedServices
      .map(id => services.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');
    const selectedBarberName = barbers.find(b => b.id === selectedBarber)?.name || '';
    const totalPrice = selectedServices
      .map(id => services.find(s => s.id === id)?.price || 0)
      .reduce((sum, price) => sum + price, 0);

    router.push({
      pathname: '/confirmation',
      params: {
        serviceIds: selectedServices.join(','),
        barberId: selectedBarber,
        date: selectedDate,
        time: selectedTime,
        serviceName: selectedServiceNames,
        barberName: selectedBarberName,
        totalPrice: totalPrice.toString(),
        ...(appointmentIds && { appointmentIds: appointmentIds }),
        ...(reschedule && { reschedule: reschedule }),
      }
    } as any);
  };

  const getDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const day = days[date.getDay()];
    const dayOfMonth = date.getDate();
    return { day, date: dayOfMonth };
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar backgroundColor={theme.bg} />
        <ActivityIndicator size="large" color="#ED1C24" />
      </View>
    );
  }

  return (
    <>
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      <StatusBar backgroundColor={theme.bg} translucent={false} />
      {/* Modern Gradient Header */}
      <LinearGradient
        colors={isDark ? ['#1E1E1E', '#0F0F0F'] : ['#FFFFFF', '#F5F5F5']}
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
        }} style={styles.backButton}>
          <Text style={[styles.backText, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>← Back</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Services Selection */}
      <View style={[styles.section, { marginTop: 20 }]}>
        <View style={[styles.sectionTitleCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Service</Text>
        </View>
        <View style={styles.optionsContainer}>
          {services.map((service) => {
            const isFullPackage = service.name.toLowerCase().includes('full package');
            return (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.optionButton,
                  { backgroundColor: selectedServices.includes(service.id) ? '#ED1C24' : theme.cardBg, borderColor: theme.cardBorder },
                  selectedServices.includes(service.id) && styles.optionButtonActive
                ]}
                onPress={() => {
                  if (isFullPackage) {
                    // If full package is clicked, either select only it or deselect it
                    if (selectedServices.includes(service.id)) {
                      setSelectedServices([]);
                    } else {
                      setSelectedServices([service.id]);
                    }
                  } else {
                    // If any other service is clicked, remove full package and toggle this service
                    const fullPackageId = services.find(s => s.name.toLowerCase().includes('full package'))?.id;
                    const withoutFullPackage = selectedServices.filter(id => id !== fullPackageId);
                    
                    if (selectedServices.includes(service.id)) {
                      setSelectedServices(withoutFullPackage.filter(id => id !== service.id));
                    } else {
                      setSelectedServices([...withoutFullPackage, service.id]);
                    }
                  }
                }}
              >
              {service.imageUrl && (
                <Image
                  source={{ uri: service.imageUrl }}
                  style={styles.serviceImage}
                  resizeMode="cover"
                />
              )}
              <Text style={[
                styles.optionText,
                { color: selectedServices.includes(service.id) ? '#FFFFFF' : theme.text },
                selectedServices.includes(service.id) && styles.optionTextActive
              ]}>
                {service.name}
              </Text>
              <Text style={[
                styles.optionSubText,
                { color: selectedServices.includes(service.id) ? '#FFFFFF' : theme.subtext },
                selectedServices.includes(service.id) && styles.optionSubTextActive
              ]}>
                ${service.price.toFixed(2)}
              </Text>
            </TouchableOpacity>
          );
          })}
        </View>
      </View>

      {/* Barber Selection */}
      <View style={styles.section}>
        <View style={[styles.sectionTitleCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Barber</Text>
        </View>
        <View style={styles.optionsContainer}>
          {barbers.map((barber) => (
            <TouchableOpacity
              key={barber.id}
              style={[
                styles.optionButton,
                { backgroundColor: selectedBarber === barber.id ? '#00A651' : theme.cardBg, borderColor: theme.cardBorder }
              ]}
              onPress={() => setSelectedBarber(barber.id)}
            >
              {barber.imageUrl ? (
                <Image
                  source={{ uri: barber.imageUrl }}
                  style={styles.barberImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.barberPlaceholder, { backgroundColor: selectedBarber === barber.id ? '#008A43' : '#00A651' }]}>
                  <Text style={styles.barberPlaceholderText}>{barber.name.charAt(0)}</Text>
                </View>
              )}
              <Text style={[
                styles.optionText,
                { color: selectedBarber === barber.id ? '#FFFFFF' : theme.text }
              ]}>
                {barber.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Date Selection */}
      <View style={styles.section}>
        <View style={[styles.sectionTitleCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Date</Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.datesScroll}
        >
          {dates.map((date, index) => {
            const { day, date: dayNum } = getDateDisplay(date);
            const now = new Date();
            const dateOnly = new Date(date + 'T23:59:59');
            const isPast = dateOnly < now;
            return (
              <TouchableOpacity
                key={date}
                style={[
                  styles.dateButton,
                  isPast
                    ? { backgroundColor: '#CCCCCC', borderColor: '#999999' }
                    : { backgroundColor: selectedDate === date ? '#ED1C24' : theme.cardBg, borderColor: theme.cardBorder },
                  selectedDate === date && styles.dateButtonActive
                ]}
                onPress={() => !isPast && setSelectedDate(date)}
                disabled={isPast}
              >
                <Text style={[
                  styles.dateDay,
                  isPast ? { color: '#666666' } : { color: selectedDate === date ? '#FFFFFF' : theme.text },
                  selectedDate === date && styles.dateDayActive
                ]}>
                  {day}
                </Text>
                <Text style={[
                  styles.dateNum,
                  isPast ? { color: '#666666' } : { color: selectedDate === date ? '#FFFFFF' : theme.text },
                  selectedDate === date && styles.dateNumActive
                ]}>
                  {dayNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Time Selection */}
      <View style={styles.section}>
        <View style={[styles.sectionTitleCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Time</Text>
        </View>
        {loadingAvailability && <ActivityIndicator size="small" color="#ED1C24" style={{ marginBottom: 8 }} />}
        <View style={styles.timesGrid}>
          {timeSlots.map((time) => {
            const available = isTimeAvailable(time);
            const isBooked = bookedTimes.includes(time);
            const isPastTime = isTimePast(selectedDate, time);
            return (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeButton,
                  available
                    ? { backgroundColor: selectedTime === time ? '#ED1C24' : theme.cardBg, borderColor: theme.cardBorder }
                    : { backgroundColor: '#CCCCCC', borderColor: '#999999' },
                  selectedTime === time && styles.timeButtonActive
                ]}
                onPress={() => available && setSelectedTime(time)}
                disabled={!available}
              >
                <Text style={[
                  styles.timeText,
                  available
                    ? { color: selectedTime === time ? '#FFFFFF' : theme.text }
                    : { color: '#666666' },
                  selectedTime === time && styles.timeTextActive
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Modern Gradient Confirm Button */}
      <LinearGradient
        colors={['#ED1C24', '#C41018']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.confirmButton}
      >
        <TouchableOpacity 
          style={styles.confirmButtonInner}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>CONFIRM BOOKING</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={{ height: 30 }} />
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 12,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitleCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignSelf: 'center',
    width: '90%',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  optionButtonActive: {
    backgroundColor: '#ED1C24',
    borderColor: '#ED1C24',
  },
  serviceImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  barberImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  barberPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barberPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  optionText: {
    fontWeight: '600',
    fontSize: 14,
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  optionSubText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: 'bold',
  },
  optionSubTextActive: {
    color: '#FFFFFF',
  },
  datesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  dateButton: {
    width: 70,
    height: 90,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dateButtonActive: {
    backgroundColor: '#ED1C24',
    borderColor: '#ED1C24',
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  dateDayActive: {
    color: '#FFFFFF',
    opacity: 1,
  },
  dateNum: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 6,
  },
  dateNumActive: {
    color: '#FFFFFF',
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeButton: {
    flex: 1,
    minWidth: '30%',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  timeButtonActive: {
    backgroundColor: '#ED1C24',
    borderColor: '#ED1C24',
  },
  timeText: {
    fontWeight: '600',
    fontSize: 14,
  },
  timeTextActive: {
    color: '#FFFFFF',
  },
  confirmButton: {
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    marginTop: 24,
  },
  confirmButtonInner: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
