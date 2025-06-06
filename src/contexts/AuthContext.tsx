import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Define user roles
export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MANAGER = 'manager',
  REGULAR = 'regular'
}

// Define user interface
export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phoneNumber: string;
  position: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register?: (email: string, password: string, name: string, role: UserRole, phoneNumber: string, position: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUserProfile: (updatedUser: User) => void;
  verifyPassword: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for testing
// Remove mockUsers. All user data will come from Supabase Auth and the profiles table.

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Fetch user profile from Supabase
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error, status } = await supabase.from('profiles').select('*').eq('id', userId).single();
      console.log('fetchUserProfile status:', status, 'data:', data, 'error:', error);
      if (error) {
        alert('Error fetching profile: ' + error.message);
        return null;
      }
      if (!data) {
        alert('No profile data found for user. Check if the profiles table has a row with the correct id.');
        return null;
      }
      return {
        id: data.id,
        name: data.name,
        role: data.role as UserRole,
        email: data.email,
        phoneNumber: data.phone_number,
        position: data.position,
        profilePicture: data.profile_picture || undefined,
      };
    } catch (err: any) {
      alert('Unexpected error fetching profile: ' + (err?.message || err));
      return null;
    }
  };


  // Login with Supabase Auth (using email)
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('Auth result:', data, error);
      if (error || !data.user) {
        alert('Login failed: ' + (error?.message || 'Unknown error'));
        return false;
      }
      const profile = await fetchUserProfile(data.user.id);
      console.log('Profile result:', profile);
      if (!profile) {
        alert('Profile not found for this user. Please ensure the profiles table has a row with the correct id.');
        return false;
      }
      setUser(profile);
      return true;
    } catch (err: any) {
      alert('Unexpected error during login: ' + (err?.message || err));
      return false;
    }
  };


  // Register new user
  const register = async (email: string, password: string, name: string, role: UserRole, phoneNumber: string, position: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) return false;
    // Insert profile
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: data.user.id,
        name,
        role,
        email,
        phone_number: phoneNumber,
        position,
      }
    ]);
    if (profileError) return false;
    // Optionally: auto-login after registration
    const profile = await fetchUserProfile(data.user.id);
    if (profile) setUser(profile);
    return !!profile;
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Update profile
  const updateUserProfile = async (updatedUser: User) => {
    setUser(updatedUser);
    await supabase.from('profiles').update({
      name: updatedUser.name,
      role: updatedUser.role,
      email: updatedUser.email,
      phone_number: updatedUser.phoneNumber,
      position: updatedUser.position,
      profile_picture: updatedUser.profilePicture || null,
    }).eq('id', updatedUser.id);
  };

  // Password verification is not needed; handled by Supabase Auth
  const verifyPassword = async (_password: string) => true;

  // On mount, get current session and profile
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        if (profile) setUser(profile);
      }
    };
    getSession();
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (profile) setUser(profile);
      } else {
        setUser(null);
      }
    });
    return () => { listener.subscription.unsubscribe(); };
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      updateUserProfile,
      verifyPassword,
      // Optionally expose register
      register,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 