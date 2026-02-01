import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تسجيل الخروج', onPress: logout, style: 'destructive' },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        {user?.picture ? (
          <Image source={{ uri: user.picture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color="#D4AF37" />
          </View>
        )}
        <Text style={styles.userName}>{user?.name || 'مستخدم'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>الحساب</Text>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIcon}>
              <Ionicons name="person-outline" size={24} color="#D4AF37" />
            </View>
            <Text style={styles.menuItemText}>معلومات الحساب</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B8B8B8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIcon}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#D4AF37" />
            </View>
            <Text style={styles.menuItemText}>الأمان والخصوصية</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B8B8B8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIcon}>
              <Ionicons name="notifications-outline" size={24} color="#D4AF37" />
            </View>
            <Text style={styles.menuItemText}>الإشعارات</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B8B8B8" />
        </TouchableOpacity>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>الدعم</Text>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIcon}>
              <Ionicons name="help-circle-outline" size={24} color="#D4AF37" />
            </View>
            <Text style={styles.menuItemText}>مركز المساعدة</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B8B8B8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIcon}>
              <Ionicons name="document-text-outline" size={24} color="#D4AF37" />
            </View>
            <Text style={styles.menuItemText}>الشروط والأحكام</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B8B8B8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIcon}>
              <Ionicons name="information-circle-outline" size={24} color="#D4AF37" />
            </View>
            <Text style={styles.menuItemText}>عن التطبيق</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B8B8B8" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#EF4444" />
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#B8B8B8',
  },
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B8B8B8',
    marginBottom: 12,
    textAlign: 'right',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'right',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    marginHorizontal: 20,
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  versionText: {
    fontSize: 12,
    color: '#808080',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
});