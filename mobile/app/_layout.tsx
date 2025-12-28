import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  name: string;
  type: 'customer' | 'barber';
}

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<'customer' | 'barber' | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user: User = JSON.parse(userData);
          setIsLoggedIn(true);
          setUserType(user.type);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#ED1C24" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {isLoggedIn ? (
        <>
          {userType === 'barber' ? (
            <>
              <Stack.Screen name="barber-home" />
              <Stack.Screen name="barber-appointments" />
            </>
          ) : (
            <>
              <Stack.Screen name="home" />
              <Stack.Screen name="booking" />
              <Stack.Screen name="appointments" />
              <Stack.Screen name="confirmation" />
            </>
          )}
        </>
      ) : (
        <>
          <Stack.Screen name="index" />
          <Stack.Screen name="signup" />
        </>
      )}
    </Stack>
  );
}
