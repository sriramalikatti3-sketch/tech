import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  signInWithGoogle as fbSignInWithGoogle,
  signInDemoUser as fbSignInDemo,
  logoutUser as fbLogout,
  onAuthStateChanged,
  User,
} from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  idToken: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User>;
  signInDemo: () => Promise<User>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          setIdToken(token);
        } catch (err) {
          console.error('Error fetching Firebase ID token:', err);
          setIdToken(null);
        }
      } else {
        setIdToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<User> => {
    const u = await fbSignInWithGoogle();
    const token = await u.getIdToken();
    setIdToken(token);
    setUser(u);
    return u;
  };

  const signInDemo = async (): Promise<User> => {
    const u = await fbSignInDemo();
    const token = await u.getIdToken();
    setIdToken(token);
    setUser(u);
    return u;
  };

  const signOut = async (): Promise<void> => {
    await fbLogout();
    setUser(null);
    setIdToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        loading,
        signInWithGoogle,
        signInDemo,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
