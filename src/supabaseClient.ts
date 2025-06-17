import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(`Invalid Supabase URL: ${supabaseUrl}`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'supabase.auth.token',
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') return null;
        const value = window.localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(key, JSON.stringify(value));
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') return;
        window.localStorage.removeItem(key);
      },
    },
  },
  global: {
    headers: {
      'x-application-name': 'employee-portal',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
