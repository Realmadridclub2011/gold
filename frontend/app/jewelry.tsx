import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'https://golden-treasury.preview.emergentagent.com';

interface JewelryItem {
  item_id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  weight_grams: number;
  karat: number;
  category: string;
  in_stock: boolean;
}

export default function JewelryScreen() {
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchJewelry();
  }, []);

  const fetchJewelry = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/jewelry`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Fetch jewelry error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyJewelry = async (item: JewelryItem) => {
    try {
      const orderData = {
        items: [
          {
            item_id: item.item_id,
            item_type: 'jewelry',
            name: item.name_ar,
            quantity: 1,
            price_per_unit: item.price,
            total: item.price,
          },
        ],
        total_amount: item.price,
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
          `تم طلب ${item.name_ar} بنجاح. سيتم توصيله خلال 3-5 أيام عمل`,
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
      console.error('Buy jewelry error:', error);
      Alert.alert('خطأ', 'فشل إتمام الطلب');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'necklace':
        return 'diamond';
      case 'ring':
        return 'ellipse';
      case 'bracelet':
        return 'hand-left';
      case 'earrings':
        return 'flower';
      default:
        return 'diamond';
    }
  };

  const categories = [
    { id: 'all', name: 'الكل' },
    { id: 'necklace', name: 'قلادات' },
    { id: 'ring', name: 'خواتم' },
    { id: 'bracelet', name: 'أساور' },
    { id: 'earrings', name: 'أقراط' },
  ];

  const filteredItems =
    selectedCategory === 'all'
      ? items
      : items.filter((item) => item.category === selectedCategory);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const renderJewelryItem = ({ item }: { item: JewelryItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemIconContainer}>
        <Ionicons name={getCategoryIcon(item.category)} size={40} color="#D4AF37" />
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name_ar}</Text>
        <Text style={styles.itemDescription}>{item.description_ar}</Text>
        
        <View style={styles.itemDetails}>
          <View style={styles.detailBadge}>
            <Text style={styles.detailText}>عيار {item.karat}</Text>
          </View>
          <View style={styles.detailBadge}>
            <Text style={styles.detailText}>{item.weight_grams}جم</Text>
          </View>
        </View>

        <View style={styles.itemFooter}>
          <Text style={styles.itemPrice}>{item.price.toFixed(2)} \u0631\u064a\u0627\u0644</Text>
          
          {item.in_stock ? (
            <TouchableOpacity
              style={styles.buyButton}
              onPress={() => handleBuyJewelry(item)}
            >
              <Ionicons name="cart" size={20} color="#1A1A1A" />
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>مجوهرات ذهبية فاخرة</Text>
        <Text style={styles.headerSubtitle}>تشكيلة راقية مع توصيل مجاني</Text>
      </View>

      {/* Category Filter */}
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

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.item_id}
        renderItem={renderJewelryItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="diamond-outline" size={60} color="#808080" />
            <Text style={styles.emptyText}>لا توجد مجوهرات متاحة حالياً</Text>
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
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
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
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  itemIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'right',
  },
  itemDescription: {
    fontSize: 14,
    color: '#B8B8B8',
    marginBottom: 8,
    textAlign: 'right',
  },
  itemDetails: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'flex-end',
  },
  detailBadge: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailText: {
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: '600',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  outOfStockBadge: {
    backgroundColor: '#EF4444' + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  outOfStockText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
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