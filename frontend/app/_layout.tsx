import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { View, ActivityIndicator, I18nManager, Platform } from 'react-native';

// Force RTL layout
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1A1A1A',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'تسجيل الدخول', headerShown: false }} />
        <Stack.Screen name="investment" options={{ title: 'الاستثمار في الذهب' }} />
        <Stack.Screen name="jewelry" options={{ title: 'المجوهرات' }} />
        <Stack.Screen name="vouchers" options={{ title: 'القسائم الرقمية' }} />
      </Stack>
    </AuthProvider>
  );
}