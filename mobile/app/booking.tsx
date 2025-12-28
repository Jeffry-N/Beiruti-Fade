import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBarbers, getServices } from '../api';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
}

interface Barber {
  id: number;
  name: string;
  bio: string;
}

export default function BookingScreen() {
  const router = useRouter();
  const { serviceId: initialServiceId } = useLocalSearchParams();
  
  const [selectedService, setSelectedService] = useState<number | null>(
    initialServiceId ? Number(initialServiceId) : null
  );
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleConfirm = () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      Alert.alert('Error', 'Please select all options');
      return;
    }

    const selectedServiceName = services.find(s => s.id === selectedService)?.name || '';
    const selectedBarberName = barbers.find(b => b.id === selectedBarber)?.name || '';

    router.push({
      pathname: '/confirmation',
      params: {
        serviceId: selectedService,
        barberId: selectedBarber,
        date: selectedDate,
        time: selectedTime,
        serviceName: selectedServiceName,
        barberName: selectedBarberName,
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ED1C24" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Book Appointment</Text>

      {/* Services Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Service</Text>
        <View style={styles.optionsContainer}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.optionButton,
                selectedService === service.id && styles.optionButtonActive
              ]}
              onPress={() => setSelectedService(service.id)}
            >
              <Text style={[
                styles.optionText,
                selectedService === service.id && styles.optionTextActive
              ]}>
                {service.name}
              </Text>
              <Text style={[
                styles.optionSubText,
                selectedService === service.id && styles.optionSubTextActive
              ]}>
                ${service.price.toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Barber Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Barber</Text>
        <View style={styles.optionsContainer}>
          {barbers.map((barber) => (
            <TouchableOpacity
              key={barber.id}
              style={[
                styles.optionButton,
                selectedBarber === barber.id && styles.optionButtonActive
              ]}
              onPress={() => setSelectedBarber(barber.id)}
            >
              <Text style={[
                styles.optionText,
                selectedBarber === barber.id && styles.optionTextActive
              ]}>
                {barber.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.datesScroll}
        >
          {dates.map((date, index) => {
            const { day, date: dayNum } = getDateDisplay(date);
            return (
              <TouchableOpacity
                key={date}
                style={[
                  styles.dateButton,
                  selectedDate === date && styles.dateButtonActive
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dateDay,
                  selectedDate === date && styles.dateDayActive
                ]}>
                  {day}
                </Text>
                <Text style={[
                  styles.dateNum,
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
        <Text style={styles.sectionTitle}>Select Time</Text>
        <View style={styles.timesGrid}>
          {timeSlots.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeButton,
                selectedTime === time && styles.timeButtonActive
              ]}
              onPress={() => setSelectedTime(time)}
            >
              <Text style={[
                styles.timeText,
                selectedTime === time && styles.timeTextActive
              ]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Confirm Button */}
      <TouchableOpacity 
        style={styles.confirmButton}
        onPress={handleConfirm}
      >
        <Text style={styles.confirmButtonText}>CONTINUE TO CONFIRM</Text>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  backButton: {
    marginTop: 16,
    marginBottom: 20,
  },
  backText: {
    color: '#00A651',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    color: '#1A1A1A',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionButtonActive: {
    backgroundColor: '#ED1C24',
    borderColor: '#ED1C24',
  },
  optionText: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 12,
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  optionSubText: {
    color: '#666',
    fontSize: 10,
    marginTop: 4,
  },
  optionSubTextActive: {
    color: '#FFFFFF',
  },
  datesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  dateButton: {
    width: 60,
    height: 80,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  dateButtonActive: {
    backgroundColor: '#ED1C24',
    borderColor: '#ED1C24',
  },
  dateDay: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
  },
  dateDayActive: {
    color: '#FFFFFF',
  },
  dateNum: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  dateNumActive: {
    color: '#FFFFFF',
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  timeButtonActive: {
    backgroundColor: '#00A651',
    borderColor: '#00A651',
  },
  timeText: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 13,
  },
  timeTextActive: {
    color: '#FFFFFF',
  },
  confirmButton: {
    backgroundColor: '#ED1C24',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#ED1C24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
