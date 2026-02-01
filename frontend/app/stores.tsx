import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'https://golden-treasury.preview.emergentagent.com';

// صور تجريبية عالية الجودة من Unsplash
const JEWELRY_IMAGES = {
  necklace: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
  ring: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400',
  bracelet: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400',
  earrings: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400',
};

interface Store {
  store_id: string;
  name_ar: string;
  rating: number;
  total_products: number;
  is_verified: boolean;
}

interface JewelryItem {
  item_id: string;
  store_id: string;
  store_name: string;
  name_ar: string;
  description_ar: string;
  price: number;
  weight_grams: number;
  karat: number;
  category: string;
  image_url?: string;
  in_stock: boolean;
  rating?: number;
}

export default function StoresScreen() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, login } = useAuth();

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/stores`);
      if (response.ok) {
        const data = await response.json();
        setStores(data);
      }
    } catch (error) {
      console.error('Fetch stores error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStorePress = (storeId: string) => {
    router.push(`/store/${storeId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const renderStoreCard = ({ item }: { item: Store }) => (
    <TouchableOpacity
      style={styles.storeCard}
      onPress={() => handleStorePress(item.store_id)}
      activeOpacity={0.7}
    >
      <View style={styles.storeHeader}>
        <View style={styles.storeIconContainer}>
          <Ionicons name=\"storefront\" size={32} color=\"#D4AF37\" />
        </View>
        <View style={styles.storeInfo}>
          <View style={styles.storeNameRow}>
            <Text style={styles.storeName}>{item.name_ar}</Text>
            {item.is_verified && (
              <Ionicons name=\"checkmark-circle\" size={20} color=\"#10B981\" />
            )}
          </View>
          <View style={styles.storeStats}>
            <View style={styles.ratingContainer}>
              <Ionicons name=\"star\" size={16} color=\"#FCD34D\" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.productsText}>
              {item.total_products} منتج
            </Text>
          </View>
        </View>
        <Ionicons name=\"chevron-back\" size={24} color=\"#B8B8B8\" />
      </View>
      
      <View style={styles.storeBadge}>
        <Text style={styles.storeBadgeText}>
          تصفح المجوهرات
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>محلات المجوهرات</Text>
        <Text style={styles.headerSubtitle}>
          اختر المحل وتصفح مجموعته الفاخرة
        </Text>
      </View>

      {!user && (
        <TouchableOpacity style={styles.guestBanner} onPress={login}>
          <Ionicons name=\"person-outline\" size={20} color=\"#D4AF37\" />
          <Text style={styles.guestText}>
            سجل دخولك للشراء والاستثمار
          </Text>
          <Ionicons name=\"arrow-back\" size={20} color=\"#D4AF37\" />
        </TouchableOpacity>
      )}

      <FlatList
        data={stores}
        keyExtractor={(item) => item.store_id}
        renderItem={renderStoreCard}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name=\"storefront-outline\" size={60} color=\"#808080\" />
            <Text style={styles.emptyText}>لا توجد محلات متاحة حالياً</Text>
          </View>
        }
      />
    </View>
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
    fontSize: 28,
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
  guestBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4AF37',
    gap: 12,
  },
  guestText: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  storeCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  storeHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  storeInfo: {
    flex: 1,
  },
  storeNameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  storeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  storeStats: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
  },
  ratingContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#FCD34D',
    fontWeight: '600',
  },
  productsText: {
    fontSize: 14,
    color: '#B8B8B8',
  },
  storeBadge: {
    backgroundColor: '#D4AF37',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  storeBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#808080',
    marginTop: 16,
  },
});
