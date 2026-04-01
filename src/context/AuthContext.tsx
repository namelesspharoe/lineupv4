import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User } from '../types';
import { signIn, signUp, logout } from '../services/auth';
import { getUserById } from '../services/users';

/** Firestore user doc may lag right after `createUser` — avoid clearing session with a stale null read. */
async function getUserByIdWithRetry(uid: string): Promise<User | null> {
  const maxAttempts = 8;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const userData = await getUserById(uid);
    if (userData) return userData;
    await new Promise((r) => setTimeout(r, 80 + attempt * 120));
  }
  return null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, userData: Omit<User, 'id'>) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUserByIdWithRetry(firebaseUser.uid);
        setUser(userData);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      const user = await signIn(email, password);
      setUser(user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleSignup = async (email: string, password: string, userData: Omit<User, 'id'>) => {
    try {
      const user = await signUp(email, password, userData);
      setUser(user);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
        updateUser,
        isLoading
      }}
    >
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