import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getServices, getBarbers } from '../api';
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

export default function HomeScreen() {
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
  const [user, setUser] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'barbers' | 'promo'>('services');

    const { visible, config, hide, alert } = useThemeAlert();
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

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    router.replace('/' as any);
  };

  const handleBooking = () => {
    router.push({
      pathname: '/booking'
    } as any);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ED1C24" />
      </View>
    );
  }

  return (
    <>
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={[styles.scrollContent]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: '#00A651' }]}>Welcome back</Text>
          <Text style={[styles.userName, { color: theme.text }]}>{user?.name || 'User'}</Text>
          <TouchableOpacity onPress={() => router.push('/profile-edit' as any)}>
            <Text style={styles.editLink}>✎ Edit Profile</Text>
          </TouchableOpacity>
          <Text style={[styles.balance, { color: '#ED1C24' }]}>$100.00</Text>
          <Text style={[styles.balanceLabel, { color: theme.subtext }]}>TOP UP</Text>
        </View>
        <TouchableOpacity 
          style={styles.logoutButtonHeader}
          onPress={handleLogout}
        >
          <Text style={styles.logoutTextHeader}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[activeTab === 'services' ? styles.tabActive : styles.tab, { backgroundColor: activeTab === 'services' ? '#ED1C24' : theme.cardBg }]}
          onPress={() => setActiveTab('services')}
        >
          <Text style={[activeTab === 'services' ? styles.tabTextActive : styles.tabText, { color: activeTab === 'services' ? '#FFFFFF' : theme.text }]}>SERVICES</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[activeTab === 'barbers' ? styles.tabActive : styles.tab, { backgroundColor: activeTab === 'barbers' ? '#ED1C24' : theme.cardBg }]}
          onPress={() => setActiveTab('barbers')}
        >
          <Text style={[activeTab === 'barbers' ? styles.tabTextActive : styles.tabText, { color: activeTab === 'barbers' ? '#FFFFFF' : theme.text }]}>BARBERS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[activeTab === 'promo' ? styles.tabActive : styles.tab, { backgroundColor: activeTab === 'promo' ? '#ED1C24' : theme.cardBg }]}
          onPress={() => setActiveTab('promo')}
        >
          <Text style={[activeTab === 'promo' ? styles.tabTextActive : styles.tabText, { color: activeTab === 'promo' ? '#FFFFFF' : theme.text }]}>PROMO</Text>
        </TouchableOpacity>
      </View>

      {/* Services */}
      {activeTab === 'services' && (
      <View style={styles.servicesContainer}>
        {services.map((service) => (
          <TouchableOpacity 
            key={service.id} 
            style={[styles.serviceCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            onPress={() => router.push({ pathname: '/service-detail', params: { id: String(service.id), name: service.name, description: service.description, price: String(service.price) } } as any)}
          >
            <View style={styles.serviceIcon}>
              {service.imageUrl ? (
                <Image
                  source={{ uri: service.imageUrl }}
                  style={styles.serviceIconImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.iconText}>✂️</Text>
              )}
            </View>
            <View style={styles.serviceInfo}>
              <Text style={[styles.serviceName, { color: theme.text }]}>{service.name}</Text>
              <Text style={[styles.serviceDescription, { color: theme.subtext }]} numberOfLines={2}>{service.description}</Text>
              <Text style={[styles.servicePrice, { color: '#ED1C24' }]}>${service.price}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      )}

      {/* Barbers Tab */}
      {activeTab === 'barbers' && (
      <View style={styles.barbersSection}>
        {barbers.map((barber) => (
          <TouchableOpacity key={barber.id} style={[styles.barberCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]} onPress={() => router.push({ pathname: '/barber-detail', params: { id: String(barber.id) } } as any)}>
            <View style={styles.barberAvatar}>
              {barber.imageUrl ? (
                <Image
                  source={{ uri: barber.imageUrl }}
                  style={styles.barberAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{barber.name.charAt(0)}</Text>
              )}
            </View>
            <View style={styles.barberInfo}>
              <Text style={[styles.barberName, { color: theme.text }]}>{barber.name}</Text>
              <Text style={[styles.barberBio, { color: theme.subtext }]}>{barber.bio}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      )}

      {/* Promo Tab */}
      {activeTab === 'promo' && (
      <View style={styles.barbersSection}>
        <View style={{padding: 20, backgroundColor: theme.cardBg, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.cardBorder}}>
          <Text style={{color: '#ED1C24', fontSize: 18, fontWeight: 'bold', marginBottom: 8}}>🎉 New Customer Special</Text>
          <Text style={{color: theme.text, fontSize: 14, marginBottom: 8}}>Get 20% off your first appointment!</Text>
          <Text style={{color: theme.subtext, fontSize: 12}}>Use code: WELCOME20</Text>
        </View>
        <View style={{padding: 20, backgroundColor: theme.cardBg, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.cardBorder}}>
          <Text style={{color: '#00A651', fontSize: 18, fontWeight: 'bold', marginBottom: 8}}>💈 Weekend Special</Text>
          <Text style={{color: theme.text, fontSize: 14, marginBottom: 8}}>Book 3 services, get the 4th free!</Text>
          <Text style={{color: theme.subtext, fontSize: 12}}>Valid Saturday & Sunday</Text>
        </View>
      </View>
      )}

      <View style={styles.footerSpacer} />

      <View style={styles.footerButtons}>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={handleBooking}
        >
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.appointmentsButton}
          onPress={() => router.push('/appointments' as any)}
        >
          <Text style={styles.appointmentsButtonText}>My Appointments</Text>
        </TouchableOpacity>
      </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
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
  balance: {
    color: '#ED1C24',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  balanceLabel: {
    color: '#666',
    fontSize: 10,
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
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'center',
    gap: 8,
  },
  tabActive: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ED1C24',
    borderRadius: 4,
    marginRight: 8,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    marginRight: 8,
  },
  tabText: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 12,
  },
  servicesContainer: {
    marginBottom: 20,
  },
  serviceCard: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#00A651',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  serviceIconImage: {
    width: 48,
    height: 48,
  },
  iconText: {
    fontSize: 24,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    marginBottom: 6,
  },
  servicePrice: {
    color: '#ED1C24',
    fontSize: 13,
    fontWeight: '600',
  },
  serviceDesc: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ED1C24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusSign: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bookButton: {
    backgroundColor: '#00A651',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#00A651',
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
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  loadMore: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  barbersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  barberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  barberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00A651',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  barberAvatarImage: {
    width: 44,
    height: 44,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  barberInfo: {
    flex: 1,
  },
  barberName: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 13,
  },
  barberBio: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  appointmentsButton: {
    backgroundColor: '#ED1C24',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#ED1C24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  footerButtons: {
    marginTop: 'auto',
  },
  footerSpacer: {
    height: 12,
  },
  appointmentsButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
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
