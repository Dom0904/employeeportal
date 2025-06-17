import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
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
  id_number: string;
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
  getAllUsers: () => Promise<User[]>;
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
        id_number: data.id_number,
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


  // Login with ID number and password
  const login = async (idNumber: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with ID:', idNumber);
      
      // Fetch the user's email and profile data in a single query
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email, id, name, role, phone_number, position, profile_picture')
        .eq('id_number', idNumber)
        .single();

      if (profileError || !profileData) {
        console.error('Profile lookup error:', profileError);
        return false;
      }

      // Now, log in with the email and password
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: profileData.email, 
        password 
      });

      if (error || !data.user) {
        console.error('Auth error:', error);
        return false;
      }

      // Use the profile data we already have instead of fetching it again
      const user: User = {
        id: profileData.id,
        id_number: idNumber,
        name: profileData.name,
        role: profileData.role as UserRole,
        email: profileData.email,
        phoneNumber: profileData.phone_number,
        position: profileData.position,
        profilePicture: profileData.profile_picture || undefined,
      };

      setUser(user);
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
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

  // Get all users
  const getAllUsers = useCallback(async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase.from('profiles').select('id, name, id_number, role, position');
      if (error) {
        console.error('Error fetching all users:', error);
        return [];
      }
      return data.map(profile => ({
        id: profile.id,
        name: profile.name,
        id_number: profile.id_number || '',
        role: profile.role as UserRole,
        email: '',
        phoneNumber: '',
        position: profile.position || '',
      }));
    } catch (error) {
      console.error('Unexpected error fetching all users:', error);
      return [];
    }
  }, []);

  // On mount, get current session and profile
  useEffect(() => {
    const getSession = async () => {
      console.log('AuthContext: Attempting to get user session');
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('AuthContext: Error getting user session:', error);
        setUser(null);
        return;
      }
      console.log('AuthContext: getUser data:', data);
      if (data.user) {
        console.log('AuthContext: User found, fetching profile for ID:', data.user.id);
        const profile = await fetchUserProfile(data.user.id);
        if (profile) {
          console.log('AuthContext: Profile fetched:', profile);
          console.log('AuthContext: Fetched User Role:', profile.role);
          setUser(profile);
        } else {
          console.log('AuthContext: Profile not found for user ID:', data.user.id);
          setUser(null); // Ensure user is null if profile not found
        }
      } else {
        console.log('AuthContext: No user session found');
        setUser(null);
      }
    };
    getSession();
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log('AuthContext: Auth state change detected:', event, session);
      if (session?.user) {
        console.log('AuthContext: Auth state change user found, fetching profile for ID:', session.user.id);
        const profile = await fetchUserProfile(session.user.id);
        if (profile) {
          console.log('AuthContext: Auth state change profile fetched:', profile);
          console.log('AuthContext: Auth State Change Fetched User Role:', profile.role);
          setUser(profile);
        } else {
          console.log('AuthContext: Auth state change profile not found for user ID:', session.user.id);
          setUser(null); // Ensure user is null if profile not found
        }
      } else {
        console.log('AuthContext: Auth state change no user session');
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
      getAllUsers,
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