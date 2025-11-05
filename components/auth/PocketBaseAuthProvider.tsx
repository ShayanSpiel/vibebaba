"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { pb, User, getCurrentUser, logout as pbLogout } from '@/lib/pocketbase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function PocketBaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    // Force reload auth from localStorage (important after payment redirects)
    // PocketBase stores auth in localStorage automatically, but we need to ensure it's loaded
    if (typeof window !== 'undefined' && !pb.authStore.isValid) {
      const stored = localStorage.getItem('pocketbase_auth');
      if (stored) {
        try {
          const authData = JSON.parse(stored);
          if (authData.token && authData.model) {
            pb.authStore.save(authData.token, authData.model);
            console.log('🔐 Auth restored from localStorage after redirect');
          }
        } catch (e) {
          console.error('Failed to restore auth from localStorage:', e);
        }
      }
    }

    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // Sync auth cookie with current auth state
    if (currentUser && pb.authStore.token) {
      const isSecure = window.location.protocol === 'https:';
      document.cookie = `pb_auth=${JSON.stringify({
        token: pb.authStore.token,
        model: pb.authStore.model
      })}; path=/; max-age=2592000; SameSite=Lax; ${isSecure ? 'Secure;' : ''}`;
    }

    // Listen to auth store changes
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model as User | null);

      // Update cookie when auth changes
      if (token && model) {
        const isSecure = window.location.protocol === 'https:';
        document.cookie = `pb_auth=${JSON.stringify({
          token,
          model
        })}; path=/; max-age=2592000; SameSite=Lax; ${isSecure ? 'Secure;' : ''}`;
      } else {
        document.cookie = 'pb_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;';
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      setUser(authData.record as User);

      // Set auth cookie for server-side API routes
      const isSecure = window.location.protocol === 'https:';
      document.cookie = `pb_auth=${JSON.stringify({
        token: pb.authStore.token,
        model: pb.authStore.model
      })}; path=/; max-age=2592000; SameSite=Lax; ${isSecure ? 'Secure;' : ''}`;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      // Create user
      const user = await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        name,
        totalTokens: 0,
        usedTokens: 0,
        dailyTokens: 5000, // Give 5K tokens on signup
        lastDailyReset: new Date().toISOString()
      });

      // Auto-login after signup
      await login(email, password);
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Signup failed');
    }
  };

  const loginWithGoogle = async () => {
    try {
      // Use PocketBase's built-in OAuth2 method with popup
      const authData = await pb.collection('users').authWithOAuth2({
        provider: 'google',
        createData: {
          emailVisibility: false,
          totalTokens: 0,
          usedTokens: 0,
          dailyTokens: 5000, // Give 5K tokens on signup
          lastDailyReset: new Date().toISOString()
        }
      });

      console.log('✅ Google OAuth successful:', authData);

      // Update user state
      setUser(authData.record as User);

      // Set auth cookie for server-side API routes
      const isSecure = window.location.protocol === 'https:';
      document.cookie = `pb_auth=${JSON.stringify({
        token: pb.authStore.token,
        model: pb.authStore.model
      })}; path=/; max-age=2592000; SameSite=Lax; ${isSecure ? 'Secure;' : ''}`;

      // Store in localStorage as well
      localStorage.setItem('pocketbase_auth', JSON.stringify({
        token: pb.authStore.token,
        model: pb.authStore.model
      }));
    } catch (error: any) {
      console.error('❌ Google OAuth error:', error);
      throw new Error(error.message || 'Google sign-in failed');
    }
  };

  const logout = () => {
    pbLogout();
    setUser(null);

    // Clear auth cookie
    document.cookie = 'pb_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;';
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      const updated = await pb.collection('users').getOne<User>(user.id);
      setUser(updated);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function usePocketBaseAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('usePocketBaseAuth must be used within PocketBaseAuthProvider');
  }
  return context;
}

// Compatibility hook with old useAuth
export function useAuth() {
  const { user, loading, login, logout } = usePocketBaseAuth();

  return {
    session: {
      data: user ? { user } : null,
      isLoading: loading
    },
    user,
    loading,
    signIn: login,
    signOut: logout
  };
}
