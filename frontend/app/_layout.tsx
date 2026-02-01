// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { I18nManager } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
      // بعد أول تعديل يفضل إعادة تشغيل / إعادة تثبيت التطبيق
    }
  }, []);

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
            textAlign: 'right',
          },
          headerTitleAlign: 'right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{ title: 'تسجيل الدخول', headerShown: false }}
        />
        <Stack.Screen
          name="investment"
          options={{
            title: 'الاستثمار في الذهب',
            headerBackTitle: 'رجوع',
          }}
        />
        <Stack.Screen
          name="jewelry"
          options={{
            title: 'المجوهرات',
            headerBackTitle: 'رجوع',
          }}
        />
        <Stack.Screen
          name="stores"
          options={{
            title: 'محلات المجوهرات',
            headerBackTitle: 'رجوع',
          }}
        />
        <Stack.Screen
          name="store/[id]"
          options={{
            title: 'منتجات المحل',
            headerBackTitle: 'رجوع',
          }}
        />
        <Stack.Screen
          name="vouchers"
          options={{
            title: 'القسائم الرقمية',
            headerBackTitle: 'رجوع',
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
