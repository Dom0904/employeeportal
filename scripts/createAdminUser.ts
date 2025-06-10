import { createClient } from '@supabase/supabase-js';

// Load env variables (for local dev, ensure .env is loaded)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_EMAIL = '0000x@yourdomain.com';
const ADMIN_PASSWORD = 'Originacc';

async function main() {
  // 1. Sign up user in Supabase Auth
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (signUpError && !signUpError.message.includes('User already registered')) {
    console.error('Auth signUp error:', signUpError.message);
    process.exit(1);
  }

  // 2. Get user ID
  let userId = signUpData?.user?.id;
  if (!userId) {
    // User may already exist, fetch by email
    const { data: users, error: listError } = await supabase.rpc('get_user_by_email', { email: ADMIN_EMAIL });
    if (listError || !users || users.length === 0) {
      console.error('Could not find user ID for the admin.');
      process.exit(1);
    }
    userId = users[0].id;
  }

  // 3. Insert into profiles table
  const { error: profileError } = await supabase.from('profiles').upsert([
    {
      id: userId,
      name: 'Admin User',
      role: 'admin',
      email: ADMIN_EMAIL,
      phone_number: '000-000-0000',
      position: 'System Administrator',
      profile_picture: null,
    },
  ], { onConflict: 'id' });

  if (profileError) {
    console.error('Profile insert error:', profileError.message);
    process.exit(1);
  }

  console.log('Admin user created or updated successfully!');
}

main();
