import Constants from 'expo-constants';

// Central configuration for backend URL
export const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
