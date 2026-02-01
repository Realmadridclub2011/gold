import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';

export default function LoginScreen() {
  const { login, user } = useAuth();

  React.useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="diamond" size={60} color="#D4AF37" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>استثمر في الذهب</Text>
        <Text style={styles.title}>بثقة</Text>
        
        <Text style={styles.subtitle}>
          منصة رقمية متوافقة مع الشريعة
        </Text>
        <Text style={styles.subtitle}>
          للتجارة والاستثمار في الذهب
        </Text>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <Text style={styles.featureText}>متوافق مع الشريعة</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="lock-closed" size={24} color="#10B981" />
            <Text style={styles.featureText}>آمن وموثوق</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="flash" size={24} color="#10B981" />
            <Text style={styles.featureText}>أسعار فورية</Text>
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={login}>
          <Ionicons name="logo-google" size={24} color="#1A1A1A" />
          <Text style={styles.loginButtonText}>تسجيل الدخول بواسطة Google</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          بالمتابعة، أنت توافق على شروطنا وسياسة الخصوصية
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  logoContainer: {
    marginBottom: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#D4AF37',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#B8B8B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  features: {
    marginTop: 48,
    marginBottom: 48,
    width: '100%',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  termsText: {
    fontSize: 12,
    color: '#808080',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});