import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { View, ActivityIndicator, I18nManager, Platform } from 'react-native';

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
          animation: 'slide_from_left',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'تسجيل الدخول', headerShown: false }} />
        <Stack.Screen 
          name="investment" 
          options={{ 
            title: 'الاستثمار في الذهب',
            headerBackTitle: 'رجوع'
          }} 
        />
        <Stack.Screen 
          name="jewelry" 
          options={{ 
            title: 'المجوهرات',
            headerBackTitle: 'رجوع'
          }} 
        />
        <Stack.Screen 
          name="stores" 
          options={{ 
            title: 'محلات المجوهرات',
            headerBackTitle: 'رجوع'
          }} 
        />
        <Stack.Screen 
          name="store/[id]" 
          options={{ 
            title: 'منتجات المحل',
            headerBackTitle: 'رجوع'
          }} 
        />
        <Stack.Screen 
          name="vouchers" 
          options={{ 
            title: 'القسائم الرقمية',
            headerBackTitle: 'رجوع'
          }} 
        />
      </Stack>
    </AuthProvider>
  );
}
