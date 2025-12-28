import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getServices, getBarbers } from '../api';

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

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    router.replace('/' as any);
  };

  const handleBooking = (serviceId: number) => {
    router.push({
      pathname: '/booking',
      params: { serviceId }
    } as any);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#CCFF00" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.balance}>$100.00</Text>
          <Text style={styles.balanceLabel}>TOP UP</Text>
        </View>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => {}}
        >
          <Text style={styles.menuDots}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={styles.tabActive}>
          <Text style={styles.tabTextActive}>SERVICES</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>BARBERS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>PROMO</Text>
        </TouchableOpacity>
      </View>

      {/* Services */}
      <View style={styles.servicesContainer}>
        {services.map((service) => (
          <TouchableOpacity 
            key={service.id} 
            style={styles.serviceCard}
            onPress={() => handleBooking(service.id)}
          >
            <View style={styles.serviceIcon}>
              <Text style={styles.iconText}>✂️</Text>
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDesc}>{service.description}</Text>
            </View>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.plusSign}>+</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      {/* Load More */}
      <View style={styles.loadMoreContainer}>
        <Text style={styles.loadMore}>LOAD MORE</Text>
        <Text style={{color: '#CCFF00', marginLeft: 5}}>→</Text>
      </View>

      {/* Top Barbers */}
      <View style={styles.barbersSection}>
        <Text style={styles.sectionTitle}>Top Barbers</Text>
        {barbers.slice(0, 2).map((barber) => (
          <View key={barber.id} style={styles.barberCard}>
            <View style={styles.barberAvatar}>
              <Text style={styles.avatarText}>{barber.name.charAt(0)}</Text>
            </View>
            <View style={styles.barberInfo}>
              <Text style={styles.barberName}>{barber.name}</Text>
              <Text style={styles.barberBio}>{barber.bio}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* My Appointments Button */}
      <TouchableOpacity 
        style={styles.appointmentsButton}
        onPress={() => router.push('/appointments' as any)}
      >
        <Text style={styles.appointmentsButtonText}>My Appointments</Text>
      </TouchableOpacity>

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
    marginBottom: 30,
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
  balance: {
    color: '#CCFF00',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  balanceLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  menuButton: {
    padding: 8,
  },
  menuDots: {
    color: '#FFF',
    fontSize: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tabActive: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#CCFF00',
    borderRadius: 4,
    marginRight: 8,
  },
  tabTextActive: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 4,
    marginRight: 8,
  },
  tabText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  servicesContainer: {
    marginBottom: 20,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#262641',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  serviceDesc: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CCFF00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusSign: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  loadMore: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  barbersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  barberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  barberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CCFF00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 18,
  },
  barberInfo: {
    flex: 1,
  },
  barberName: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  barberBio: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  appointmentsButton: {
    backgroundColor: '#CCFF00',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentsButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
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
