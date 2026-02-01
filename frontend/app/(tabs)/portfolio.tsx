import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'https://golden-treasury.preview.emergentagent.com';

interface Portfolio {
  user_id: string;
  gold_holdings: number;
  total_invested: number;
  current_value: number;
  updated_at: string;
}

export default function PortfolioScreen() {
  const { user, loading: authLoading } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [historicalPrices, setHistoricalPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        fetchPortfolio();
        fetchHistoricalPrices();
      }
    }
  }, [user, authLoading]);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/portfolio`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPortfolio(data);
      }
    } catch (error) {
      console.error('Fetch portfolio error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalPrices = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/gold/prices/historical?days=7`);
      if (response.ok) {
        const data = await response.json();
        setHistoricalPrices(data);
      }
    } catch (error) {
      console.error('Fetch historical prices error:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const profit = portfolio ? portfolio.current_value - portfolio.total_invested : 0;
  const profitPercentage = portfolio && portfolio.total_invested > 0
    ? ((profit / portfolio.total_invested) * 100)
    : 0;

  // Prepare chart data
  const chartData = historicalPrices.length > 0
    ? {
        labels: historicalPrices.map((_, i) => i === 0 || i === historicalPrices.length - 1 ? `${i}` : ''),
        datasets: [
          {
            data: historicalPrices.map(p => p.price_24k),
            color: (opacity = 1) => `rgba(212, 175, 55, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      }
    : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>محفظتي الاستثمارية</Text>
      </View>

      {/* Total Value Card */}
      <View style={styles.valueCard}>
        <Text style={styles.valueLabel}>إجمالي القيمة</Text>
        <Text style={styles.valueAmount}>
          ${portfolio?.current_value.toFixed(2) || '0.00'}
        </Text>
        <View style={styles.profitContainer}>
          <Text style={[styles.profitText, profit >= 0 ? styles.profitPositive : styles.profitNegative]}>
            {profit >= 0 ? '+' : ''}{profit.toFixed(2)} ({profitPercentage.toFixed(2)}%)
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>الذهب المملوك</Text>
          <Text style={styles.statValue}>{portfolio?.gold_holdings.toFixed(2) || '0.00'}</Text>
          <Text style={styles.statUnit}>جرام</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>إجمالي الاستثمار</Text>
          <Text style={styles.statValue}>${portfolio?.total_invested.toFixed(2) || '0.00'}</Text>
          <Text style={styles.statUnit}>دولار</Text>
        </View>
      </View>

      {/* Chart */}
      {chartData && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>أسعار الذهب - 7 أيام</Text>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#2A2A2A',
              backgroundGradientFrom: '#2A2A2A',
              backgroundGradientTo: '#2A2A2A',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(212, 175, 55, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#D4AF37',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>معلومات هامة</Text>
        <Text style={styles.infoText}>
          • يتم تحديث الأسعار كل دقيقة{'
'}
          • قيمة محفظتك تحسب بناءً على أسعار السوق الحالية{'
'}
          • لبيع أو شراء الذهب، انتقل إلى قسم الاستثمار
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  valueCard: {
    backgroundColor: '#2A2A2A',
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  valueLabel: {
    fontSize: 16,
    color: '#B8B8B8',
    marginBottom: 8,
  },
  valueAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
  },
  profitContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
  },
  profitText: {
    fontSize: 16,
    fontWeight: '600',
  },
  profitPositive: {
    color: '#10B981',
  },
  profitNegative: {
    color: '#EF4444',
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  statLabel: {
    fontSize: 12,
    color: '#B8B8B8',
    marginBottom: 8,
    textAlign: 'right',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  statUnit: {
    fontSize: 12,
    color: '#808080',
    marginTop: 4,
    textAlign: 'right',
  },
  chartCard: {
    backgroundColor: '#2A2A2A',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'right',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  infoCard: {
    backgroundColor: '#2A2A2A',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 30,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'right',
  },
  infoText: {
    fontSize: 14,
    color: '#B8B8B8',
    lineHeight: 24,
    textAlign: 'right',
  },
});