import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testUsers = [
  {
    id: 'bb7952ab-23e3-49ba-81af-182a02e55265',
    id_number: '1001',
    email: 'admin@edgetech.com',
    password: 'password',
    name: 'Admin User',
    role: 'admin',
    phone_number: '123-456-7890',
    position: 'System Administrator'
  },
  {
    id: '13ac868a-22b3-4cfc-a725-afa77cf377b7',
    id_number: '1002',
    email: 'moderator@edgetech.com',
    password: 'password',
    name: 'Moderator User',
    role: 'moderator',
    phone_number: '123-456-7891',
    position: 'Team Lead'
  },
  {
    id: '1f80490b-dd2c-47a9-8fc4-8346c4b0f2a2',
    id_number: '1003',
    email: 'manager@edgetech.com',
    password: 'password',
    name: 'Manager User',
    role: 'manager',
    phone_number: '123-456-7892',
    position: 'Project Manager'
  },
  {
    id: '72135a2d-24b9-4b60-8afc-4b6eacd4c8c7',
    id_number: '1004',
    email: 'user@edgetech.com',
    password: 'password',
    name: 'Regular User',
    role: 'regular',
    phone_number: '123-456-7893',
    position: 'Technician'
  }
];

async function setupTestUsers() {
  console.log('Starting test users setup...');

  for (const user of testUsers) {
    try {
      console.log(`Processing user: ${user.email}`);

      // Use the provided existing user ID and directly upsert the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          id_number: user.id_number,
          name: user.name,
          role: user.role,
          email: user.email,
          phone_number: user.phone_number,
          position: user.position,
          profile_picture: null,
        }, { onConflict: 'id' });

      if (profileError) {
        console.error(`Error creating or updating profile for ${user.email}:`, profileError.message);
        continue;
      }

      console.log(`Successfully set up user: ${user.name} (${user.email})`);
    } catch (error) {
      console.error(`Unexpected error setting up user ${user.email}:`, error);
    }
  }

  console.log('Test users setup completed!');
}

setupTestUsers(); 