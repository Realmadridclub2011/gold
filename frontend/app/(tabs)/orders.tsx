import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'https://golden-treasury.preview.emergentagent.com';

interface OrderItem {
  item_id: string;
  item_type: string;
  name: string;
  quantity: number;
  price_per_unit: number;
  total: number;
}

interface Order {
  order_id: string;
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
  tracking_info?: string;
}

export default function OrdersScreen() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        fetchOrders();
      }
    }
  }, [user, authLoading]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'processing':
        return '#3B82F6';
      case 'shipped':
        return '#8B5CF6';
      case 'delivered':
        return '#10B981';
      default:
        return '#808080';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'قيد المراجعة';
      case 'processing':
        return 'قيد المعالجة';
      case 'shipped':
        return 'تم الشحن';
      case 'delivered':
        return 'تم التسليم';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time';
      case 'processing':
        return 'cog';
      case 'shipped':
        return 'airplane';
      case 'delivered':
        return 'checkmark-circle';
      default:
        return 'ellipse';
    }
  };

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color="#808080" />
        <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
        <Text style={styles.emptyText}>لم تقم بأي طلبات بعد</Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.startButtonText}>ابدأ الاستثمار</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>طلباتي</Text>
        <Text style={styles.orderCount}>{orders.length} طلب</Text>
      </View>

      {orders.map((order) => (
        <View key={order.order_id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderId}>#{order.order_id.slice(-8)}</Text>
              <Text style={styles.orderDate}>
                {new Date(order.created_at).toLocaleDateString('ar-SA')}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) + '20' },
              ]}
            >
              <Ionicons
                name={getStatusIcon(order.status)}
                size={16}
                color={getStatusColor(order.status)}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(order.status) },
                ]}
              >
                {getStatusText(order.status)}
              </Text>
            </View>
          </View>

          <View style={styles.itemsContainer}>
            {order.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQuantity}>
                    {item.quantity} {item.item_type === 'gold_bar' ? 'جرام' : 'قطعة'}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>{item.total.toFixed(2)} ريال</Text>
              </View>
            ))}
          </View>

          <View style={styles.orderFooter}>
            <Text style={styles.totalLabel}>الإجمالي</Text>
            <Text style={styles.totalAmount}>{order.total_amount.toFixed(2)} ريال</Text>
          </View>

          {order.tracking_info && (
            <View style={styles.trackingInfo}>
              <Ionicons name="location" size={16} color="#D4AF37" />
              <Text style={styles.trackingText}>{order.tracking_info}</Text>
            </View>
          )}
        </View>
      ))}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#B8B8B8',
    textAlign: 'center',
    marginBottom: 32,
  },
  startButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  orderCount: {
    fontSize: 16,
    color: '#B8B8B8',
  },
  orderCard: {
    backgroundColor: '#2A2A2A',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#B8B8B8',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemsContainer: {
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'right',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#B8B8B8',
    textAlign: 'right',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3A',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    gap: 8,
  },
  trackingText: {
    flex: 1,
    fontSize: 14,
    color: '#B8B8B8',
    textAlign: 'right',
  },
});