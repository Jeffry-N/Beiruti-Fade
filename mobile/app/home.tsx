import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, useColorScheme } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getServices, getBarbers, getAppointments } from '../api';
import ThemeModal from '../components/ThemeModal';
import { useThemeAlert } from '../hooks/useThemeAlert';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { Pressable } from 'react-native';

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
 
interface Appointment {
  id: number;
  barberId: number;
  barberName: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
}

export default function HomeScreen() {
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
  const [user, setUser] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [activeAppointments, setActiveAppointments] = useState<Appointment[]>([]);
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([]);
  const [cancelledAppointments, setCancelledAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'barbers' | 'products' | 'appointments'>('services');
  const [menuOpen, setMenuOpen] = useState(false);

  const { visible, config, hide, alert } = useThemeAlert();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA000';
      case 'confirmed':
        return '#00A651';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#ED1C24';
      default:
        return '#9E9E9E';
    }
  };

  // Sample products data (frontend only)
  const sampleProducts = [
    { id: 1, name: 'Pomade', description: 'Premium styling pomade for strong hold', price: 25, stock: 15, imageLocal: require('../assets/images/pomade.png') },
    { id: 2, name: 'Hair Gel', description: 'Professional grade hair gel', price: 18, stock: 20, imageLocal: require('../assets/images/hair-gel.png') },
    { id: 3, name: 'Beard Oil', description: 'Nourishing beard oil with natural ingredients', price: 22, stock: 12, imageLocal: require('../assets/images/beard-oil.png') },
    { id: 4, name: 'Aftershave', description: 'Soothing aftershave lotion', price: 20, stock: 18, imageLocal: require('../assets/images/aftershave.png') },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        let parsedUser: any = null;
        if (userData) {
          parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }

        const servicesResult = await getServices();
        if (servicesResult.success && Array.isArray(servicesResult.data)) {
          setServices(servicesResult.data as Service[]);
        }

        const barbersResult = await getBarbers();
        if (barbersResult.success && Array.isArray(barbersResult.data)) {
          setBarbers(barbersResult.data as Barber[]);
        }

        if (parsedUser?.id) {
          const apptResult = await getAppointments(parsedUser.id);
          if (apptResult.success && Array.isArray(apptResult.data)) {
            const raw = apptResult.data as any[];
            const active = raw.filter(apt => apt.status === 'pending' || apt.status === 'confirmed');
            const completed = raw.filter(apt => apt.status === 'completed');
            const cancelled = raw.filter(apt => apt.status === 'cancelled');
            setActiveAppointments(active as Appointment[]);
            setCompletedAppointments(completed as Appointment[]);
            setCancelledAppointments(cancelled as Appointment[]);
          }
        }
      } catch (error) {
        alert('Error', 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const refreshAppointments = async () => {
        try {
          const userData = await AsyncStorage.getItem('user');
          if (!userData) return;
          const parsedUser = JSON.parse(userData);
          const apptResult = await getAppointments(parsedUser.id);
          if (apptResult.success && Array.isArray(apptResult.data)) {
            const raw = apptResult.data as any[];
            const active = raw.filter(apt => apt.status === 'pending' || apt.status === 'confirmed');
            const completed = raw.filter(apt => apt.status === 'completed');
            const cancelled = raw.filter(apt => apt.status === 'cancelled');
            setActiveAppointments(active as Appointment[]);
            setCompletedAppointments(completed as Appointment[]);
            setCancelledAppointments(cancelled as Appointment[]);
          }
        } catch (error) {
          // ignore refresh errors
        }
      };
      refreshAppointments();
    }, [])
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator size="large" color="#ED1C24" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
          <TouchableOpacity style={[styles.modernTab, { backgroundColor: activeTab === 'services' ? (isDark ? 'rgba(237, 28, 36, 0.25)' : 'rgba(237, 28, 36, 0.1)') : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]} onPress={() => setActiveTab('services')}>
            <Text style={styles.tabEmoji}>✂️</Text>
            <Text style={[styles.modernTabText, { color: activeTab === 'services' ? '#ED1C24' : isDark ? '#B0B0B0' : '#666' }]}>Services</Text>
            {activeTab === 'services' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modernTab, { backgroundColor: activeTab === 'barbers' ? (isDark ? 'rgba(237, 28, 36, 0.25)' : 'rgba(237, 28, 36, 0.1)') : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]} onPress={() => setActiveTab('barbers')}>
            <Text style={styles.tabEmoji}>💈</Text>
            <Text style={[styles.modernTabText, { color: activeTab === 'barbers' ? '#ED1C24' : isDark ? '#B0B0B0' : '#666' }]}>Barbers</Text>
            {activeTab === 'barbers' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modernTab, { backgroundColor: activeTab === 'appointments' ? (isDark ? 'rgba(237, 28, 36, 0.25)' : 'rgba(237, 28, 36, 0.1)') : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]} onPress={() => setActiveTab('appointments')}>
            <Text style={styles.tabEmoji}>📅</Text>
            <Text style={[styles.modernTabText, { color: activeTab === 'appointments' ? '#ED1C24' : isDark ? '#B0B0B0' : '#666' }]}>Appointments</Text>
            {activeTab === 'appointments' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modernTab, { backgroundColor: activeTab === 'products' ? (isDark ? 'rgba(237, 28, 36, 0.25)' : 'rgba(237, 28, 36, 0.1)') : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]} onPress={() => setActiveTab('products')}>
            <Text style={styles.tabEmoji}>🛍️</Text>
            <Text style={[styles.modernTabText, { color: activeTab === 'products' ? '#ED1C24' : isDark ? '#B0B0B0' : '#666' }]}>Products</Text>
            {activeTab === 'products' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Services Tab */}
        {activeTab === 'services' && (
          <View style={styles.servicesContainer}>
            {services.map(service => (
              <TouchableOpacity
                key={service.id}
                style={[styles.modernServiceCard, { backgroundColor: theme.cardBg }]}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: '/booking', params: { serviceId: String(service.id) } } as any)}
              >
                <View style={styles.modernServiceIcon}>
                  {service.imageUrl ? (
                    <>
                      <Image
                        source={{ uri: service.imageUrl }}
                        style={[styles.imageBlurredBg, { opacity: isDark ? 0.3 : 0.6 }]}
                        resizeMode="cover"
                        blurRadius={20}
                      />
                      <Image
                        source={{ uri: service.imageUrl }}
                        style={styles.modernServiceImage}
                        resizeMode="contain"
                      />
                    </>
                  ) : (
                    <ExpoLinearGradient
                      colors={['#ED1C24', '#C41018']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}
                    >
                      <Text style={styles.modernIconText}>✂️</Text>
                    </ExpoLinearGradient>
                  )}
                </View>
                <View style={styles.modernServiceInfo}>
                  <Text style={[styles.modernServiceName, { color: theme.text }]}>{service.name}</Text>
                  {!!service.description && (
                    <Text style={[styles.modernServiceDescription, { color: theme.subtext }]} numberOfLines={2}>
                      {service.description}
                    </Text>
                  )}
                  <View style={styles.servicePriceContainer}>
                    <ExpoLinearGradient
                      colors={['rgba(237, 28, 36, 0.85)', 'rgba(196, 16, 24, 0.85)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.bookNowBadgeGradient}
                    >
                      <Text style={styles.bookNowText}>Book Now →</Text>
                    </ExpoLinearGradient>
                    <ExpoLinearGradient
                      colors={['rgba(237, 28, 36, 0.85)', 'rgba(196, 16, 24, 0.85)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.priceTag}
                    >
                      <Text style={styles.modernServicePrice}>${service.price}</Text>
                    </ExpoLinearGradient>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Barbers Tab */}
        {activeTab === 'barbers' && (
          <View style={styles.barbersSection}>
            {barbers.map((barber) => (
              <TouchableOpacity
                key={barber.id}
                style={[styles.modernBarberCard, { backgroundColor: theme.cardBg }]}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: '/booking', params: { barberId: String(barber.id) } } as any)}
              >
                <View style={styles.modernBarberAvatar}>
                  {barber.imageUrl ? (
                    <>
                      <Image
                        source={{ uri: barber.imageUrl }}
                        style={[styles.imageBlurredBg, { opacity: isDark ? 0.3 : 0.6 }]}
                        resizeMode="cover"
                        blurRadius={20}
                      />
                      <Image
                        source={{ uri: barber.imageUrl }}
                        style={styles.modernBarberImage}
                        resizeMode="contain"
                      />
                    </>
                  ) : (
                    <ExpoLinearGradient
                      colors={['#00A651', '#008A43']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.modernBarberPlaceholder}
                    >
                      <Text style={styles.modernBarberIconText}>💈</Text>
                    </ExpoLinearGradient>
                  )}
                </View>
                <View style={styles.modernBarberInfo}>
                  <Text style={[styles.modernBarberName, { color: theme.text }]}>{barber.name}</Text>
                  <Text style={[styles.modernBarberBio, { color: theme.subtext }]} numberOfLines={2}>{barber.bio}</Text>
                  <View style={styles.barberRatingContainer}>
                    <ExpoLinearGradient
                      colors={['rgba(237, 28, 36, 0.85)', 'rgba(196, 16, 24, 0.85)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.bookNowBadgeGradient}
                    >
                      <Text style={styles.bookNowText}>Book Now →</Text>
                    </ExpoLinearGradient>
                    <View style={styles.starsContainer}>
                      <Text style={styles.starText}>⭐⭐⭐⭐⭐</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <View style={styles.barbersSection}>
            {activeAppointments.length === 0 && completedAppointments.length === 0 && cancelledAppointments.length === 0 ? (
              <View style={[styles.appointmentsTabCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                <Text style={[styles.appointmentsTabTitle, { color: theme.text }]}>No appointments yet</Text>
                <Text style={[styles.appointmentsTabSubtext, { color: theme.subtext }]}>Book your first service to see it here.</Text>
                <TouchableOpacity style={styles.appointmentsTabCTAButton} onPress={() => router.push('/booking' as any)}>
                  <Text style={styles.appointmentsTabCTA}>Book now →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {activeAppointments.length > 0 && (
                  <View style={[styles.appointmentsSectionCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                    <View style={styles.appointmentsSectionHeader}>
                      <Text style={[styles.appointmentsSectionTitle, { color: theme.text }]}>Active</Text>
                      <Text style={styles.appointmentsSectionCount}>{activeAppointments.length}</Text>
                    </View>
                    {activeAppointments.map(apt => (
                      <View key={`active-${apt.id}`} style={[styles.appointmentCardHome, { borderColor: theme.cardBorder }]}>
                        <View style={styles.appointmentHeaderHome}>
                          <Text style={[styles.appointmentBarber, { color: theme.text }]}>{apt.barberName}</Text>
                          <View style={[styles.appointmentStatusBadge, { backgroundColor: getStatusColor(apt.status) }]}>
                            <Text style={styles.appointmentStatusText}>{apt.status.toUpperCase()}</Text>
                          </View>
                        </View>
                        <Text style={[styles.appointmentService, { color: theme.text }]}>{apt.serviceName}</Text>
                        <Text style={[styles.appointmentMeta, { color: theme.subtext }]}>{apt.date} • {apt.time}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {completedAppointments.length > 0 && (
                  <View style={[styles.appointmentsSectionCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                    <View style={styles.appointmentsSectionHeader}>
                      <Text style={[styles.appointmentsSectionTitle, { color: theme.text }]}>Completed</Text>
                      <Text style={styles.appointmentsSectionCount}>{Math.min(completedAppointments.length, 5)}</Text>
                    </View>
                    {completedAppointments.slice(0, 5).map(apt => (
                      <View key={`completed-${apt.id}`} style={[styles.appointmentCardHome, { borderColor: theme.cardBorder }]}>
                        <View style={styles.appointmentHeaderHome}>
                          <Text style={[styles.appointmentBarber, { color: theme.text }]}>{apt.barberName}</Text>
                          <View style={[styles.appointmentStatusBadge, { backgroundColor: getStatusColor(apt.status) }]}>
                            <Text style={styles.appointmentStatusText}>COMPLETED</Text>
                          </View>
                        </View>
                        <Text style={[styles.appointmentService, { color: theme.text }]}>{apt.serviceName}</Text>
                        <Text style={[styles.appointmentMeta, { color: theme.subtext }]}>{apt.date} • {apt.time}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {cancelledAppointments.length > 0 && (
                  <View style={[styles.appointmentsSectionCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                    <View style={styles.appointmentsSectionHeader}>
                      <Text style={[styles.appointmentsSectionTitle, { color: theme.text }]}>Cancelled</Text>
                      <Text style={styles.appointmentsSectionCount}>{Math.min(cancelledAppointments.length, 5)}</Text>
                    </View>
                    {cancelledAppointments.slice(0, 5).map(apt => (
                      <View key={`cancelled-${apt.id}`} style={[styles.appointmentCardHome, { borderColor: theme.cardBorder }]}>
                        <View style={styles.appointmentHeaderHome}>
                          <Text style={[styles.appointmentBarber, { color: theme.text }]}>{apt.barberName}</Text>
                          <View style={[styles.appointmentStatusBadge, { backgroundColor: getStatusColor(apt.status) }]}>
                            <Text style={styles.appointmentStatusText}>CANCELLED</Text>
                          </View>
                        </View>
                        <Text style={[styles.appointmentService, { color: theme.text }]}>{apt.serviceName}</Text>
                        <Text style={[styles.appointmentMeta, { color: theme.subtext }]}>{apt.date} • {apt.time}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <View style={styles.barbersSection}>
            {sampleProducts.map((product) => (
              <View
                key={product.id}
                style={[styles.modernBarberCard, { backgroundColor: theme.cardBg }]}
              >
                <View style={styles.modernProductIconContainer}>
                  {product.imageLocal ? (
                    <>
                      <Image
                        source={product.imageLocal}
                        style={[styles.imageBlurredBg, { opacity: isDark ? 0.3 : 0.6 }]}
                        resizeMode="cover"
                        blurRadius={20}
                      />
                      <Image
                        source={product.imageLocal}
                        style={styles.modernBarberImage}
                        resizeMode="contain"
                      />
                    </>
                  ) : (
                    <ExpoLinearGradient
                      colors={['#ED1C24', '#C41018']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.modernProductIconGradient}
                    >
                      <Text style={styles.modernProductEmoji}>📦</Text>
                    </ExpoLinearGradient>
                  )}
                </View>
                <View style={styles.modernBarberInfo}>
                  <Text style={[styles.modernBarberName, { color: theme.text }]}>{product.name}</Text>
                  <Text style={[styles.modernBarberBio, { color: theme.subtext }]} numberOfLines={2}>{product.description}</Text>
                  <View style={styles.barberRatingContainer}>
                    <ExpoLinearGradient
                      colors={['#00A651', '#008A43']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.productStockBadge}
                    >
                      <Text style={styles.productStockText}>Stock: {product.stock}</Text>
                    </ExpoLinearGradient>
                    <ExpoLinearGradient
                      colors={['#ED1C24', '#C41018']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.productPriceTagSmall}
                    >
                      <Text style={styles.productPriceTextSmall}>${product.price}</Text>
                    </ExpoLinearGradient>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footerSpacer} />
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
  scrollContent: {
    paddingBottom: 100,
  },
  // Modern Header Styles
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
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  menuButton: {
    padding: 8,
    borderRadius: 12,
  },
  menuDots: {
    fontSize: 22,
    fontWeight: '800',
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
    marginVertical: 4,
  },
  greetingModern: {
    fontSize: 16,
    opacity: 0.9,
    fontWeight: '500',
  },
  userNameModern: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  profileButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  
  // Modern Tabs
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
  modernTabActive: {
    backgroundColor: 'rgba(237, 28, 36, 0.1)',
  },
  tabEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  modernTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  modernTabTextActive: {
    color: '#ED1C24',
    fontWeight: 'bold',
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

  appointmentsButtonCard: {
    margin: 20,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  appointmentsButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  appointmentsButtonArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ED1C24',
  },

  appointmentsTabCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  appointmentsTabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  appointmentsTabTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  appointmentsTabBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  appointmentsTabBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  appointmentsTabSubtext: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  appointmentsTabFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appointmentsTabCTA: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ED1C24',
  },
  appointmentsTabCTAButton: {
    marginTop: 12,
  },
  appointmentsSectionCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  appointmentsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentsSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  appointmentsSectionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ED1C24',
  },
  appointmentCardHome: {
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
  },
  appointmentHeaderHome: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentBarber: {
    fontSize: 16,
    fontWeight: '800',
  },
  appointmentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  appointmentStatusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appointmentService: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  appointmentMeta: {
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentsViewAll: {
    marginTop: 4,
    marginBottom: 12,
    alignItems: 'center',
  },
  appointmentsViewAllText: {
    color: '#ED1C24',
    fontWeight: '700',
    fontSize: 14,
  },
  
  // Services Section
  servicesContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  modernServiceCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modernServiceIcon: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  imageBlurredBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  modernServiceImage: {
    width: '100%',
    height: '100%',
  },
  modernIconText: {
    fontSize: 48,
  },
  modernServiceInfo: {
    padding: 20,
  },
  modernServiceName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modernServiceDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  servicePriceContainer: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  modernServicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bookNowBadge: {
    backgroundColor: 'rgba(237, 28, 36, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(237, 28, 36, 0.3)',
  },
  bookNowBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bookNowText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Barbers Section
  barbersSection: {
    paddingHorizontal: 20,
    gap: 16,
  },
  
  modernBarberCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modernBarberAvatar: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  modernBarberImage: {
    width: '100%',
    height: '100%',
  },
  modernBarberPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernBarberIconText: {
    fontSize: 48,
  },
  modernAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modernBarberInfo: {
    padding: 20,
  },
  modernBarberName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modernBarberBio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  barberRatingContainer: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starText: {
    fontSize: 16,
    letterSpacing: 2,
  },
  ratingTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ratingTagText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stars: {
    fontSize: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Products Section
  modernProductIconContainer: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  modernProductIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernProductEmoji: {
    fontSize: 64,
  },
  productStockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  productStockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  productPriceTagSmall: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  productPriceTextSmall: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // Promo Cards
  modernPromoCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  promoEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  modernPromoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modernPromoDescription: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.95,
    lineHeight: 22,
    marginBottom: 16,
  },
  promoCodeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  promoCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  promoValidity: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.85,
    fontStyle: 'italic',
  },
  
  // Footer
  footerSpacer: {
    height: 100,
  },
  modernFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },
  modernBookButton: {
    borderRadius: 16,
    shadowColor: '#ED1C24',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  modernBookButtonInner: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  modernBookButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  
  // Legacy compatibility styles (for other screens that might reference these)
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30, marginTop: 20 },
  greeting: { color: '#00A651', fontSize: 14, fontWeight: '600' },
  userName: { color: '#1A1A1A', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  editLink: { color: '#00A651', fontSize: 12, fontWeight: '600', marginTop: 4 },
  balance: { color: '#ED1C24', fontSize: 18, fontWeight: 'bold', marginTop: 12 },
  balanceLabel: { color: '#666', fontSize: 10, fontWeight: '600', marginTop: 4 },
  tabsContainer: { flexDirection: 'row', marginBottom: 20, justifyContent: 'center', gap: 8 },
  tabActive: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#ED1C24', borderRadius: 4, marginRight: 8 },
  tabTextActive: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#F5F5F5', borderRadius: 4, marginRight: 8 },
  tabText: { color: '#1A1A1A', fontWeight: '600', fontSize: 12 },
  serviceCard: { width: '100%', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0', flexDirection: 'row', alignItems: 'center', gap: 12 },
  serviceIcon: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#00A651', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  serviceIconImage: { width: 48, height: 48, borderRadius: 8 },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  serviceDescription: { fontSize: 11, color: '#666', marginBottom: 4 },
  servicePrice: { fontSize: 12, fontWeight: 'bold', color: '#00A651' },
  viewButton: { backgroundColor: '#00A651', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  viewButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  barberCard: { width: '100%', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0', flexDirection: 'row', alignItems: 'center', gap: 12 },
  barberAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#00A651', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  barberAvatarImage: { width: 48, height: 48, borderRadius: 24 },
  barberInitials: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  barberInfo: { flex: 1 },
  barberName: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  barberEmail: { fontSize: 11, color: '#666' },
  selectButton: { backgroundColor: '#ED1C24', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  selectButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  promoContainer: { marginBottom: 20 },
  promoCard: { width: '100%', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 20, marginBottom: 12 },
  promoTitle: { color: '#00A651', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  promoDescription: { color: '#FFFFFF', fontSize: 11, marginBottom: 8, lineHeight: 18 },
  footer: { flexDirection: 'row', gap: 12 },
  footerButton: { flex: 1, backgroundColor: '#00A651', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  footerButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  logoutButton: { flex: 1, backgroundColor: 'transparent', borderWidth: 2, borderColor: '#ED1C24', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#ED1C24', fontWeight: 'bold', fontSize: 14 },
  bookButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  bookButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});
