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
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'https://golden-treasury.preview.emergentagent.com';

interface Product {
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

interface Store {
  store_id: string;
  name_ar: string;
  description_ar: string;
  rating: number;
  location?: string;
  phone?: string;
}

export default function StoreProductsScreen() {
  const { id } = useLocalSearchParams();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { user, login } = useAuth();

  useEffect(() => {
    if (id) {
      fetchStore();
      fetchProducts();
    }
  }, [id]);

  const fetchStore = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/stores/${id}`);
      if (response.ok) {
        const data = await response.json();
        setStore(data);
      }
    } catch (error) {
      console.error('Fetch store error:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/stores/${id}/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyProduct = async (product: Product) => {
    // Check if user is logged in
    if (!user) {
      Alert.alert(
        'تسجيل الدخول مطلوب',
        'يرجى تسجيل الدخول للمتابعة مع عملية الشراء',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تسجيل الدخول', onPress: () => login() },
        ]
      );
      return;
    }

    try {
      const orderData = {
        items: [
          {
            item_id: product.item_id,
            item_type: 'jewelry',
            name: product.name_ar,
            quantity: 1,
            price_per_unit: product.price,
            total: product.price,
          },
        ],
        total_amount: product.price,
      };

      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        Alert.alert(
          'تم الطلب بنجاح!',
          `تم طلب ${product.name_ar} بنجاح. سيتم توصيله خلال 3-5 أيام عمل`,
          [
            {
              text: 'عرض الطلبات',
              onPress: () => router.push('/(tabs)/orders'),
            },
            { text: 'حسناً' },
          ]
        );
      }
    } catch (error) {
      console.error('Buy product error:', error);
      Alert.alert('خطأ', 'فشل إتمام الطلب');
    }
  };

  const categories = [
    { id: 'all', name: 'الكل' },
    { id: 'necklace', name: 'قلادات' },
    { id: 'ring', name: 'خواتم' },
    { id: 'bracelet', name: 'أساور' },
    { id: 'earrings', name: 'أقراط' },
  ];

  const filteredProducts =
    selectedCategory === 'all'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const renderProductCard = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/300' }}
        style={styles.productImage}
        resizeMode="cover"
      />

      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name_ar}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description_ar}
        </Text>

        <View style={styles.productDetails}>
          <View style={styles.detailBadge}>
            <Text style={styles.detailText}>عيار {item.karat}</Text>
          </View>
          <View style={styles.detailBadge}>
            <Text style={styles.detailText}>{item.weight_grams}جم</Text>
          </View>
          {item.rating && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#FCD34D" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>

        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>{item.price.toFixed(2)} ريال</Text>

          {item.in_stock ? (
            <TouchableOpacity
              style={styles.buyButton}
              onPress={() => handleBuyProduct(item)}
            >
              <Ionicons name="cart" size={18} color="#1A1A1A" />
              <Text style={styles.buyButtonText}>اشتري الآن</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>نفذ من المخزون</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Store Header */}
      {store && (
        <View style={styles.storeHeader}>
          <View style={styles.storeIconLarge}>
            <Ionicons name="storefront" size={40} color="#D4AF37" />
          </View>
          <Text style={styles.storeTitle}>{store.name_ar}</Text>
          <Text style={styles.storeSubtitle}>{store.description_ar}</Text>

          <View style={styles.storeStats}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={20} color="#FCD34D" />
              <Text style={styles.statText}>{store.rating}</Text>
            </View>
            {store.location && (
              <View style={styles.statItem}>
                <Ionicons name="location" size={20} color="#D4AF37" />
                <Text style={styles.statText}>{store.location}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {!user && (
        <View style={styles.guestBanner}>
          <Ionicons name="information-circle" size={20} color="#D4AF37" />
          <Text style={styles.guestText}>
            يمكنك التصفح، ولكن تحتاج لتسجيل الدخول للشراء
          </Text>
        </View>
      )}

      {/* Categories Filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.categoriesContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === item.id && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === item.id && styles.categoryTextActive,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.item_id}
        renderItem={renderProductCard}
        numColumns={2}
        contentContainerStyle={styles.productsGrid}
        columnWrapperStyle={styles.productRow}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="diamond-outline" size={60} color="#808080" />
            <Text style={styles.emptyText}>لا توجد منتجات في هذا القسم</Text>
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
  storeHeader: {
    backgroundColor: '#2A2A2A',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  storeIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  storeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
  },
  storeSubtitle: {
    fontSize: 14,
    color: '#B8B8B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  storeStats: {
    flexDirection: 'row-reverse',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  guestBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
    gap: 8,
  },
  guestText: {
    fontSize: 12,
    color: '#D4AF37',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#D4AF37' + '20',
    borderColor: '#D4AF37',
  },
  categoryText: {
    fontSize: 14,
    color: '#B8B8B8',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#D4AF37',
  },
  productsGrid: {
    padding: 12,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#1A1A1A',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'right',
  },
  productDescription: {
    fontSize: 11,
    color: '#B8B8B8',
    marginBottom: 8,
    textAlign: 'right',
  },
  productDetails: {
    flexDirection: 'row-reverse',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  detailBadge: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailText: {
    fontSize: 10,
    color: '#D4AF37',
    fontWeight: '600',
  },
  ratingBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 10,
    color: '#FCD34D',
    fontWeight: '600',
  },
  productFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  buyButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  buyButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  outOfStockBadge: {
    backgroundColor: '#EF4444' + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  outOfStockText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    width: '100%',
  },
  emptyText: {
    fontSize: 16,
    color: '#808080',
    marginTop: 16,
  },
});