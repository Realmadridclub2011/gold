// هذا الملف الآن يوجه المستخدم لصفحة المحلات الجديدة
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function JewelryRedirect() {
  useEffect(() => {
    // Redirect to stores page
    router.replace('/stores');
  }, []);

  return null;
}