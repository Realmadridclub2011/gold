import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import Constants from 'expo-constants';

const BACKEND_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
  'https://golden-treasury.preview.emergentagent.com';

interface GoldPrice {
  price_24k: number;
  price_22k: number;
  price_18k: number;
  currency: string;
  timestamp: string;
}

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();
  const [goldPrice, setGoldPrice] = useState<GoldPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      fetchGoldPrice();
    }
  }, [authLoading]);

  const fetchGoldPrice = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/gold/prices/current`);
      if (response.ok) {
        const data = await response.json();
        setGoldPrice(data);
      }
    } catch (error) {
      console.error('Fetch gold price error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGoldPrice();
  };

  const handleWhatsAppSupport = () => {
    const message = 'مرحبا، أحتاج لمساعدة';
    const phoneNumber = '1234567890'; // Replace with actual support number
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
      message,
    )}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('خطأ', 'تطبيق واتساب غير متوفر');
        }
      })
      .catch((err) => console.error('WhatsApp error:', err));
  };

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#D4AF37"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greeting}>مرحبا</Text>
          <Text style={styles.userName}>{user?.name || 'مستخدم'}</Text>
        </View>
        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={handleWhatsAppSupport}
        >
          <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>استثمر في الذهب</Text>
        <Text style={styles.heroTitle}>بثقة</Text>
        <Text style={styles.heroSubtitle}>
          منصة رقمية متوافقة مع الشريعة
        </Text>
        <Text style={styles.heroSubtitle}>للتجارة والاستثمار في الذهب</Text>
      </View>

      {/* Gold Price Card */}
      {goldPrice && (
        <View style={styles.priceCard}>
          <View style={styles.priceHeader}>
            <Text style={styles.priceTitle}>أسعار الذهب الفورية</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>مباشر</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>عيار 24</Text>
            <Text style={styles.priceValue}>
              {goldPrice.price_24k.toFixed(2)} ريال
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>عيار 22</Text>
            <Text style={styles.priceValue}>
              {goldPrice.price_22k.toFixed(2)} ريال
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>عيار 18</Text>
            <Text style={styles.priceValue}>
              {goldPrice.price_18k.toFixed(2)} ريال
            </Text>
          </View>

          <Text style={styles.priceNote}>السعر للجرام الواحد</Text>
        </View>
      )}

      {/* Features */}
      <Text style={styles.sectionTitle}>الخدمات</Text>

      <TouchableOpacity
        style={styles.featureCard}
        onPress={() => router.push('/investment')}
      >
        <View style={styles.featureIcon}>
          <Ionicons name="cube" size={32} color="#D4AF37" />
        </View>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>الاستثمار في سبائك الذهب</Text>
          <Text style={styles.featureDescription}>
            استثمر في سبائك الذهب الخالص بعيار 24
          </Text>
        </View>
        <Ionicons name="chevron-back" size={24} color="#B8B8B8" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.featureCard}
        onPress={() => router.push('/jewelry')}
      >
        <View style={styles.featureIcon}>
          <Ionicons name="diamond" size={32} color="#D4AF37" />
        </View>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>مجوهرات ذهبية فاخرة</Text>
          <Text style={styles.featureDescription}>
            تشكيلة راقية من المجوهرات مع خدمة توصيل
          </Text>
        </View>
        <Ionicons name="chevron-back" size={24} color="#B8B8B8" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.featureCard}
        onPress={() => router.push('/vouchers')}
      >
        <View style={styles.featureIcon}>
          <Ionicons name="gift" size={32} color="#D4AF37" />
        </View>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>قسائم هدايا رقمية</Text>
          <Text style={styles.featureDescription}>
            أرسل قسائم ذهب رقمية عبر واتساب
          </Text>
        </View>
        <Ionicons name="chevron-back" size={24} color="#B8B8B8" />
      </TouchableOpacity>

      {/* Why Choose Us */}
      <Text style={styles.sectionTitle}>لماذا نحن؟</Text>

      <View style={styles.benefitCard}>
        <View style={styles.benefitIcon}>
          <Text style={styles.benefitEmoji}>✅</Text>
        </View>
        <View style={styles.benefitContent}>
          <Text style={styles.benefitTitle}>متوافق مع الشريعة</Text>
          <Text style={styles.benefitDescription}>
            جميع المعاملات تتبع الضوابط الشرعية
          </Text>
        </View>
      </View>

      <View style={styles.benefitCard}>
        <View style={styles.benefitIcon}>
          <Text style={styles.benefitEmoji}>🔒</Text>
        </View>
        <View style={styles.benefitContent}>
          <Text style={styles.benefitTitle}>آمن وموثوق</Text>
          <Text style={styles.benefitDescription}>
            حماية استثماراتك بأعلى معايير الأمان
          </Text>
        </View>
      </View>

      <View style={[styles.benefitCard, { marginBottom: 30 }]}>
        <View style={styles.benefitIcon}>
          <Text style={styles.benefitEmoji}>⚡</Text>
        </View>
        <View style={styles.benefitContent}>
          <Text style={styles.benefitTitle}>أسعار فورية</Text>
          <Text style={styles.benefitDescription}>
            أسعار محدثة لحظياً كل دقيقة
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    direction: 'rtl',
  },
  content: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  headerTextContainer: {
    alignItems: 'flex-end',
  },
  greeting: {
    fontSize: 16,
    color: '#B8B8B8',
    textAlign: 'right',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'right',
  },
  whatsappButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    padding: 20,
    paddingTop: 10,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#D4AF37',
    textAlign: 'right',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#B8B8B8',
    marginTop: 12,
    textAlign: 'right',
    lineHeight: 24,
  },
  priceCard: {
    backgroundColor: '#2A2A2A',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  priceHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  liveIndicator: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginLeft: 6,
  },
  liveText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  priceLabel: {
    fontSize: 16,
    color: '#B8B8B8',
    textAlign: 'right',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  priceNote: {
    fontSize: 12,
    color: '#808080',
    marginTop: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'right',
  },
  featureCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'right',
  },
  featureDescription: {
    fontSize: 14,
    color: '#B8B8B8',
    textAlign: 'right',
  },
  benefitCard: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  benefitIcon: {
    marginLeft: 12,
  },
  benefitEmoji: {
    fontSize: 28,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'right',
  },
  benefitDescription: {
    fontSize: 14,
    color: '#B8B8B8',
    lineHeight: 20,
    textAlign: 'right',
  },
});
