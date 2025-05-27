import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase ANON KEY:', supabaseAnonKey ? 'Loaded' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: '0000x@yourdomain.com',
    password: 'Originacc',
  });

  if (error) {
    console.error('Login failed:', error.message);
  } else {
    console.log('Login success! User:', data.user);
  }
}

testLogin();
