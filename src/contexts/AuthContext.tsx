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
  const [loading, setLoading] = useState(true);

  // Fetch user profile from Supabase
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error, status } = await supabase.from('profiles').select('*').eq('id', userId).single();
      console.log('fetchUserProfile status:', status, 'data:', data, 'error:', error);
      if (error) {
        console.error('Error fetching profile:', error.message);
        return null;
      }
      if (!data) {
        console.warn('No profile data found for user:', userId, '. Check if the profiles table has a row with the correct id.');
        return null;
      }
      return {
        id: data.id,
        id_number: data.id_number || '',
        name: data.name || '',
        role: data.role as UserRole,
        email: data.email || '',
        phoneNumber: data.phone_number || '',
        position: data.position || '',
        profilePicture: data.profile_picture || undefined,
      };
    } catch (err: any) {
      console.error('Unexpected error fetching profile:', (err?.message || err));
      return null;
    }
  };


  // Login with ID number and password
  const login = async (idNumber: string, password: string): Promise<boolean> => {
    try {
      console.log('Login attempt started:', { idNumber, timestamp: new Date().toISOString() });
      
      // Fetch the user's email and profile data in a single query
      console.log('Fetching profile data...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email, id, name, role, phone_number, position, profile_picture, id_number')
        .eq('id_number', idNumber)
        .single();

      if (profileError) {
        console.error('Profile lookup error:', {
          error: profileError,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        });
        return false;
      }

      if (!profileData) {
        console.error('No profile data found for ID number:', idNumber);
        return false;
      }

      console.log('Profile found, attempting auth...', { 
        email: profileData.email,
        timestamp: new Date().toISOString()
      });

      // Now, log in with the email and password
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: profileData.email, 
        password 
      });

      if (error) {
        console.error('Auth error:', {
          error,
          message: error.message,
          status: error.status,
          name: error.name
        });
        return false;
      }

      if (!data.user) {
        console.error('No user data returned from auth');
        return false;
      }

      console.log('Auth successful, creating user object...', {
        userId: data.user.id,
        timestamp: new Date().toISOString()
      });

      // Use the profile data we already have instead of fetching it again
      const user: User = {
        id: profileData.id,
        id_number: profileData.id_number || '',
        name: profileData.name || '',
        role: profileData.role as UserRole,
        email: profileData.email || '',
        phoneNumber: profileData.phone_number || '',
        position: profileData.position || '',
        profilePicture: profileData.profile_picture || undefined,
      };

      setUser(user);
      console.log('Login process completed successfully', {
        userId: user.id,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (err: any) {
      console.error('Login error:', {
        error: err,
        message: err?.message,
        stack: err?.stack,
        timestamp: new Date().toISOString()
      });
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
  const logout = async (): Promise<void> => {
    console.log('Logout initiated.');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      setUser(null);
      console.log('Logout successful, user state cleared.');
    } catch (err) {
      console.error('Unexpected error during logout:', err);
    }
  };

  // Update user profile
  const updateUserProfile = async (updatedUser: User) => {
    if (!user) {
      console.error('No user logged in to update profile.');
      return;
    }

    try {
      const updates = {
        name: updatedUser.name,
        role: updatedUser.role,
        email: updatedUser.email,
        phone_number: updatedUser.phoneNumber,
        position: updatedUser.position,
        profile_picture: updatedUser.profilePicture,
        id_number: updatedUser.id_number,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }

      // Update local user state after successful update
      setUser(updatedUser);
      console.log('User profile updated successfully!');
    } catch (err) {
      console.error('Unexpected error updating profile:', err);
    }
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    if (!user || !user.email) {
      console.warn('Cannot verify password: User not logged in or email missing.');
      return false;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (error) {
        console.error('Password verification failed:', error);
        return false;
      }
      // If no error, sign-in was successful, so password is valid
      return true;
    } catch (err) {
      console.error('Unexpected error during password verification:', err);
      return false;
    }
  };

  const getAllUsers = async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, id_number, name, role, email, phone_number, position, profile_picture');

      if (error) {
        console.error('Error fetching all users:', error);
        return [];
      }

      return data.map(profile => ({
        id: profile.id,
        id_number: profile.id_number || '',
        name: profile.name || '',
        role: profile.role as UserRole,
        email: profile.email || '',
        phoneNumber: profile.phone_number || '',
        position: profile.position || '',
        profilePicture: profile.profile_picture || undefined,
      }));
    } catch (err) {
      console.error('Unexpected error fetching all users:', err);
      return [];
    }
  };

  // Effect to handle initial session and auth state changes
  useEffect(() => {
    console.log('AuthContext useEffect triggered for session monitoring.');

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state change detected:', event, session ? 'Session present' : 'No session');
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          if (session?.user) {
            console.log('AuthContext: Auth state change user found, fetching profile for ID:', session.user.id);
            const profile = await fetchUserProfile(session.user.id);
            if (profile) {
              console.log('AuthContext: Auth state change profile fetched:', profile);
              const userRole = profile.role as UserRole;
              console.log('AuthContext: Auth State Change Fetched User Role:', userRole);
              setUser({
                id: session.user.id,
                id_number: profile.id_number || '',
                name: profile.name,
                role: userRole,
                email: session.user.email || '',
                phoneNumber: profile.phoneNumber || '',
                position: profile.position || '',
                profilePicture: profile.profilePicture || undefined,
              });
            } else {
              console.warn('AuthContext: Auth state change profile not found for user ID:', session.user.id);
              setUser(null); // Clear user if profile not found
            }
          } else {
            console.log('AuthContext: Auth state change no user session');
            setUser(null);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthContext: User signed out.');
          setUser(null);
        }
      }
    );

    // Initial session check (important for SSR or initial load)
    const getInitialSession = async () => {
      console.log('AuthContext: Attempting to get initial session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('AuthContext: Error getting user session:', error.message);
        setUser(null);
      } else if (session?.user) {
        console.log('AuthContext: Initial session found, fetching profile...', session.user.id);
        const profile = await fetchUserProfile(session.user.id);
        if (profile) {
          const userRole = profile.role as UserRole;
          setUser({
            id: session.user.id,
            id_number: profile.id_number || '',
            name: profile.name,
            role: userRole,
            email: session.user.email || '',
            phoneNumber: profile.phoneNumber || '',
            position: profile.position || '',
            profilePicture: profile.profilePicture || undefined,
          });
          console.log('AuthContext: Initial session profile set.');
        } else {
          console.warn('AuthContext: Initial session, but profile not found. Clearing user.');
          setUser(null); // Clear user if profile not found for initial session
        }
      } else {
        console.log('AuthContext: No initial session found.');
        setUser(null);
      }
      setLoading(false);
      console.log('AuthContext: Initial session check complete.');
    };

    getInitialSession();

    return () => {
      console.log('AuthContext: Cleaning up auth listener.');
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array means this runs once on mount

  const isAuthenticated = !!user;

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated,
    updateUserProfile,
    verifyPassword,
    getAllUsers,
    loading, // Expose loading state
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Render children only when authentication is loaded */}
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