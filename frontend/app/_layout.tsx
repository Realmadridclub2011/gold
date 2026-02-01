// frontend/app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';

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
        <Stack.Screen
          name="login"
          options={{ title: 'تسجيل الدخول', headerShown: false }}
        />
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
