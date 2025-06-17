import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase Client Init: NEXT_PUBLIC_SUPABASE_URL', supabaseUrl ? 'Present' : 'Missing');
console.log('Supabase Client Init: NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase Client Init Error: Missing required environment variables.', {
    supabaseUrlPresent: !!supabaseUrl,
    supabaseAnonKeyPresent: !!supabaseAnonKey,
  });
  // You might want to throw an error here, or handle it gracefully
  // For now, we'll proceed but expect issues.
  // throw new Error('Missing Supabase environment variables.');
}

// Validate URL format
try {
  if (supabaseUrl) {
    new URL(supabaseUrl);
    console.log('Supabase Client Init: URL format valid.');
  } else {
    console.warn('Supabase Client Init: URL not present, skipping format validation.');
  }
} catch (error) {
  console.error('Supabase Client Init Error: Invalid Supabase URL format.', supabaseUrl, error);
  // throw new Error(`Invalid Supabase URL: ${supabaseUrl}`);
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
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

console.log('Supabase Client Init: Client instance created.');
