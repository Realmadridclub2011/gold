import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { I18nManager, Platform } from 'react-native';
import * as Updates from 'expo-updates';

// Force RTL for Arabic
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
  if (Platform.OS !== 'web') {
    // Reload app on native to apply RTL
    Updates.reloadAsync();
  }
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1A1A1A',
          },
          headerTintColor: '#D4AF37',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'تسجيل الدخول', headerShown: false }} />
        <Stack.Screen 
          name="investment" 
          options={{ 
            title: 'الاستثمار في الذهب',
          }} 
        />
        <Stack.Screen 
          name="jewelry" 
          options={{ 
            title: 'المجوهرات',
          }} 
        />
        <Stack.Screen 
          name="stores" 
          options={{ 
            title: 'محلات المجوهرات',
          }} 
        />
        <Stack.Screen 
          name="store/[id]" 
          options={{ 
            title: 'منتجات المحل',
          }} 
        />
        <Stack.Screen 
          name="vouchers" 
          options={{ 
            title: 'القسائم الرقمية',
          }} 
        />
      </Stack>
    </AuthProvider>
  );
}
