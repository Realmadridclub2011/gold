import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'https://golden-treasury.preview.emergentagent.com';

interface GoldPrice {
  price_24k: number;
  price_22k: number;
  price_18k: number;
  currency: string;
}

export default function InvestmentScreen() {
  const { user } = useAuth();
  const [goldPrice, setGoldPrice] = useState<GoldPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [grams, setGrams] = useState('10');
  const [selectedKarat, setSelectedKarat] = useState(24);

  useEffect(() => {
    fetchGoldPrice();
  }, []);

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
    }
  };

  const getCurrentPrice = () => {
    if (!goldPrice) return 0;
    switch (selectedKarat) {
      case 24:
        return goldPrice.price_24k;
      case 22:
        return goldPrice.price_22k;
      case 18:
        return goldPrice.price_18k;
      default:
        return goldPrice.price_24k;
    }
  };

  const getTotalPrice = () => {
    const pricePerGram = getCurrentPrice();
    const gramsValue = parseFloat(grams) || 0;
    return pricePerGram * gramsValue;
  };

  const handleBuyGold = async () => {
    const gramsValue = parseFloat(grams);
    if (!gramsValue || gramsValue <= 0) {
      Alert.alert('خطأ', 'الرجاء إدخال كمية صحيحة');
      return;
    }

    const total = getTotalPrice();

    try {
      const orderData = {
        items: [
          {
            item_id: `gold_bar_${selectedKarat}k`,
            item_type: 'gold_bar',
            name: `سبائك ذهب عيار ${selectedKarat}`,
            quantity: gramsValue,
            price_per_unit: getCurrentPrice(),
            total: total,
          },
        ],
        total_amount: total,
      };

      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        Alert.alert(
          'نجح الشراء!',
          `تم شراء ${gramsValue} جرام من الذهب عيار ${selectedKarat} بنجاح`,
          [
            {
              text: 'عرض الطلبات',
              onPress: () => router.push('/(tabs)/orders'),
            },
            { text: 'حسناً' },
          ]
        );
        setGrams('10');
      } else {
        throw new Error('فشل إنشاء الطلب');
      }
    } catch (error) {
      console.error('Buy gold error:', error);
      Alert.alert('خطأ', 'فشل إتمام عملية الشراء');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الاستثمار في سبائك الذهب</Text>
        <Text style={styles.headerSubtitle}>
          استثمر في سبائك الذهب الخالص بأسعار فورية
        </Text>
      </View>

      {/* Karat Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>اختر العيار</Text>
        <View style={styles.karatContainer}>
          {[24, 22, 18].map((karat) => (
            <TouchableOpacity
              key={karat}
              style={[
                styles.karatButton,
                selectedKarat === karat && styles.karatButtonActive,
              ]}
              onPress={() => setSelectedKarat(karat)}
            >
              <Text
                style={[
                  styles.karatText,
                  selectedKarat === karat && styles.karatTextActive,
                ]}
              >
                عيار {karat}
              </Text>
              {goldPrice && (
                <Text
                  style={[
                    styles.karatPrice,
                    selectedKarat === karat && styles.karatPriceActive,
                  ]}
                >
                  ${karat === 24 ? goldPrice.price_24k.toFixed(2) : 
                    karat === 22 ? goldPrice.price_22k.toFixed(2) : 
                    goldPrice.price_18k.toFixed(2)}/جم
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Amount Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الكمية (بالجرام)</Text>
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => {
              const current = parseFloat(grams) || 0;
              if (current > 1) setGrams((current - 1).toString());
            }}
          >
            <Ionicons name="remove" size={24} color="#D4AF37" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={grams}
            onChangeText={setGrams}
            keyboardType="numeric"
            placeholder="10"
            placeholderTextColor="#808080"
          />

          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => {
              const current = parseFloat(grams) || 0;
              setGrams((current + 1).toString());
            }}
          >
            <Ionicons name="add" size={24} color="#D4AF37" />
          </TouchableOpacity>
        </View>

        {/* Quick Select */}
        <View style={styles.quickSelect}>
          {[10, 50, 100, 500].map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.quickButton}
              onPress={() => setGrams(amount.toString())}
            >
              <Text style={styles.quickButtonText}>{amount}جم</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>السعر للجرام</Text>
          <Text style={styles.summaryValue}>
            ${getCurrentPrice().toFixed(2)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>الكمية</Text>
          <Text style={styles.summaryValue}>{grams} جرام</Text>
        </View>

        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>الإجمالي</Text>
          <Text style={styles.totalValue}>${getTotalPrice().toFixed(2)}</Text>
        </View>
      </View>

      {/* Buy Button */}
      <TouchableOpacity style={styles.buyButton} onPress={handleBuyGold}>
        <Ionicons name="cart" size={24} color="#1A1A1A" />
        <Text style={styles.buyButtonText}>شراء الآن</Text>
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#D4AF37" />
        <Text style={styles.infoText}>
          • جميع المعاملات متوافقة مع الشريعة الإسلامية{'\n'}
          • يتم تحديث الأسعار كل دقيقة{'\n'}
          • إمكانية البيع في أي وقت{'\n'}
          • تخزين آمن ومؤمن
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  header: {
    padding: 20,
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
    textAlign: 'right',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#B8B8B8',
    textAlign: 'right',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'right',
  },
  karatContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  karatButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3A3A3A',
    alignItems: 'center',
  },
  karatButtonActive: {
    borderColor: '#D4AF37',
    backgroundColor: '#D4AF37' + '20',
  },
  karatText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B8B8B8',
    marginBottom: 4,
  },
  karatTextActive: {
    color: '#D4AF37',
  },
  karatPrice: {
    fontSize: 12,
    color: '#808080',
  },
  karatPriceActive: {
    color: '#D4AF37',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adjustButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  input: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  quickSelect: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  quickButtonText: {
    fontSize: 14,
    color: '#B8B8B8',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#2A2A2A',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#B8B8B8',
  },
  summaryValue: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#3A3A3A',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 18,
    borderRadius: 16,
    gap: 12,
  },
  buyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#B8B8B8',
    lineHeight: 22,
    textAlign: 'right',
  },
});
