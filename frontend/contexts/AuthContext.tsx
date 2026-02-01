import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform, I18nManager } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';

// Force RTL
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
}

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
const AUTH_URL = 'https://auth.emergentagent.com';

interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  gold_balance: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkExistingSession();
    handleDeepLink();
  }, []);

  const handleDeepLink = () => {
    // Handle initial URL (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        processAuthUrl(url);
      }
    });

    // Handle URL changes (hot link)
    const subscription = Linking.addEventListener('url', (event) => {
      processAuthUrl(event.url);
    });

    return () => subscription.remove();
  };

  const processAuthUrl = async (url: string) => {
    if (!url) return;

    // Parse session_id from URL (support both hash and query)
    const sessionIdMatch = url.match(/[#?]session_id=([^&]+)/);
    if (sessionIdMatch) {
      const sessionId = sessionIdMatch[1];
      await exchangeSession(sessionId);
    }
  };

  const exchangeSession = async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser({
          user_id: userData.id,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          gold_balance: 0,
        });
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Session exchange error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingSession = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
      // If not logged in, that's okay - allow guest browsing
    } catch (error) {
      console.error('Check session error:', error);
      // Allow guest access even if check fails
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      let redirectUrl: string;
      
      if (Platform.OS === 'web') {
        // Use window.location.origin for web (dynamic, works across all environments)
        if (typeof window !== 'undefined') {
          redirectUrl = window.location.origin + '/';
        } else {
          redirectUrl = BACKEND_URL + '/';
        }
      } else {
        // For native mobile, use deep linking
        redirectUrl = Linking.createURL('/');
      }

      const authUrl = `${AUTH_URL}/?redirect=${encodeURIComponent(redirectUrl)}`;

      if (Platform.OS === 'web') {
        window.location.href = authUrl;
      } else {
        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
        if (result.type === 'success' && result.url) {
          await processAuthUrl(result.url);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    await checkExistingSession();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}