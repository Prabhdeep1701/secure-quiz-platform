"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getIdToken
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string, role: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [manualRole, setManualRole] = useState<string | null>(null);

  const fetchUserRole = useCallback(async (user: User) => {
    try {
      const token = await getIdToken(user);
      console.log('Got ID token, length:', token.length);
      
      const response = await fetch('/api/auth/user-role', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('User role response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('User role data:', data);
        // Only set role if we don't have a manual role set
        if (!manualRole) {
          setUserRole(data.role);
        } else {
          console.log('Keeping manual role:', manualRole);
          setUserRole(manualRole);
        }
      } else if (response.status === 404) {
        // User exists in Firebase Auth but not in Firestore
        console.log('User not found in database, creating profile...');
        await createUserProfile(user);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to get user role:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }, [manualRole]);

  const createUserProfile = async (user: User) => {
    try {
      const token = await getIdToken(user);
      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email,
          role: 'Student', // Default role
          provider: user.providerData[0]?.providerId || 'email'
        })
      });

      console.log('Create user profile response status:', response.status);

      if (response.ok) {
        setUserRole('Student');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to create user profile:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      setUser(user);
      if (user) {
        console.log('User UID:', user.uid);
        // Only fetch user role if we're not in the middle of registration
        if (!isRegistering) {
          await fetchUserRole(user);
        } else {
          console.log('Skipping fetchUserRole during registration');
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [isRegistering, fetchUserRole]);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful, UID:', result.user.uid);
      
      // Create user document via server-side API
      const token = await getIdToken(result.user);
      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          uid: result.user.uid,
          name: result.user.displayName,
          email: result.user.email,
          role: 'Student', // Default role for Google sign-in
          provider: 'google'
        })
      });

      console.log('Create user response status:', response.status);

      if (response.ok) {
        setUserRole('Student');
      } else {
        // User might already exist, try to get their role
        await fetchUserRole(result.user);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Email sign-in successful, UID:', result.user.uid);
      await fetchUserRole(result.user);
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string, role: string) => {
    try {
      console.log('Starting email sign-up with role:', role);
      setIsRegistering(true);
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Email sign-up successful, UID:', result.user.uid);
      
      // Create user document via server-side API
      const token = await getIdToken(result.user);
      console.log('Got ID token for user creation');
      
      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          uid: result.user.uid,
          name,
          email,
          role,
          provider: 'email'
        })
      });

      console.log('Create user response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('User creation successful, setting role to:', role);
        console.log('Response data:', responseData);
        
        // Set the manual role to prevent override
        setManualRole(role);
        setUserRole(role);
        console.log('Manual role set to:', role);
        console.log('Role set in context:', role);
        
        // Ensure user state is updated
        setUser(result.user);
        console.log('User state updated:', result.user.uid);
        
        // Wait a bit then clear the registering flag
        setTimeout(() => {
          setIsRegistering(false);
          console.log('Registration flag cleared');
        }, 2000);
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to create user:', response.status, errorData);
        setIsRegistering(false);
        throw new Error('Failed to create user profile');
      }
    } catch (error) {
      console.error('Email sign-up error:', error);
      setIsRegistering(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserRole(null);
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await getIdToken(user);
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  };

  const value = {
    user,
    userRole,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    getIdToken: getAuthToken
  };

  return (
    <AuthContext.Provider value={value}>
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