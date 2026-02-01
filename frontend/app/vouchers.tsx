import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'https://golden-treasury.preview.emergentagent.com';

export default function VouchersScreen() {
  const [amount, setAmount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [message, setMessage] = useState('');

  const predefinedAmounts = [50, 100, 200, 500];

  const handleCreateVoucher = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('خطأ', 'الرجاء إدخال مبلغ صحيح');
      return;
    }

    if (!recipientName.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال اسم المستلم');
      return;
    }

    if (!recipientPhone.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال رقم هاتف المستلم');
      return;
    }

    try {
      const voucherData = {
        amount: parseFloat(amount),
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
      };

      const response = await fetch(`${BACKEND_URL}/api/vouchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(voucherData),
      });

      if (response.ok) {
        const voucher = await response.json();
        
        // Generate WhatsApp message
        const voucherMessage = `
مرحباً ${recipientName}! 🎁

لقد حصلت على قسيمة ذهب رقمية بقيمة $${amount}

رمز القسيمة: ${voucher.voucher_id}

${message ? `رسالة من المرسل: ${message}\n\n` : ''}
للاستفادة من القسيمة، قم بزيارة تطبيقنا وإدخال الرمز.

شكراً لاستخدامك خدماتنا!
`;

        // Open WhatsApp
        const whatsappUrl = `whatsapp://send?phone=${recipientPhone}&text=${encodeURIComponent(voucherMessage)}`;
        
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
          await Linking.openURL(whatsappUrl);
          
          Alert.alert(
            'تم إنشاء القسيمة!',
            'تم فتح واتساب لإرسال القسيمة',
            [
              {
                text: 'حسناً',
                onPress: () => {
                  setAmount('');
                  setRecipientName('');
                  setRecipientPhone('');
                  setMessage('');
                },
              },
            ]
          );
        } else {
          Alert.alert('خطأ', 'تطبيق واتساب غير متوفر');
        }
      }
    } catch (error) {
      console.error('Create voucher error:', error);
      Alert.alert('خطأ', 'فشل إنشاء القسيمة');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>قسائم هدايا رقمية</Text>
        <Text style={styles.headerSubtitle}>
          أرسل قسائم ذهب رقمية عبر واتساب
        </Text>
      </View>

      {/* Amount Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>قيمة القسيمة</Text>
        
        <View style={styles.amountButtons}>
          {predefinedAmounts.map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.amountButton,
                amount === value.toString() && styles.amountButtonActive,
              ]}
              onPress={() => setAmount(value.toString())}
            >
              <Text
                style={[
                  styles.amountText,
                  amount === value.toString() && styles.amountTextActive,
                ]}
              >
                ${value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="أو أدخل مبلغ مخصص"
          placeholderTextColor="#808080"
          keyboardType="numeric"
        />
      </View>

      {/* Recipient Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>معلومات المستلم</Text>
        
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#D4AF37" />
          <TextInput
            style={styles.textInput}
            value={recipientName}
            onChangeText={setRecipientName}
            placeholder="اسم المستلم"
            placeholderTextColor="#808080"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color="#D4AF37" />
          <TextInput
            style={styles.textInput}
            value={recipientPhone}
            onChangeText={setRecipientPhone}
            placeholder="رقم الهاتف (مع رمز الدولة)"
            placeholderTextColor="#808080"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="chatbubble-outline" size={20} color="#D4AF37" />
          <TextInput
            style={[styles.textInput, styles.messageInput]}
            value={message}
            onChangeText={setMessage}
            placeholder="رسالة اختيارية"
            placeholderTextColor="#808080"
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Preview */}
      {amount && recipientName && (
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>معاينة القسيمة</Text>
          
          <View style={styles.voucherPreview}>
            <Ionicons name="gift" size={60} color="#D4AF37" />
            <Text style={styles.voucherAmount}>${amount}</Text>
            <Text style={styles.voucherRecipient}>إلى: {recipientName}</Text>
          </View>
        </View>
      )}

      {/* Send Button */}
      <TouchableOpacity
        style={styles.sendButton}
        onPress={handleCreateVoucher}
      >
        <Ionicons name="logo-whatsapp" size={24} color="#1A1A1A" />
        <Text style={styles.sendButtonText}>إرسال عبر واتساب</Text>
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#D4AF37" />
        <Text style={styles.infoText}>
          • سيتم إرسال القسيمة عبر واتساب{'
'}
          • يمكن استخدام القسيمة لشراء الذهب أو المجوهرات{'
'}
          • القسيمة صالحة لمدة سنة من تاريخ الإصدار{'
'}
          • يمكن تتبع حالة القسيمة من قسم الطلبات
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
  amountButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  amountButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3A3A3A',
    alignItems: 'center',
  },
  amountButtonActive: {
    borderColor: '#D4AF37',
    backgroundColor: '#D4AF37' + '20',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B8B8B8',
  },
  amountTextActive: {
    color: '#D4AF37',
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'right',
  },
  messageInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  previewCard: {
    backgroundColor: '#2A2A2A',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'right',
  },
  voucherPreview: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderStyle: 'dashed',
  },
  voucherAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginTop: 12,
  },
  voucherRecipient: {
    fontSize: 16,
    color: '#B8B8B8',
    marginTop: 8,
  },
  sendButton: {
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
  sendButtonText: {
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