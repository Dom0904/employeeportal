import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with the Service Role Key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use the Service Role Key here
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Temporarily log a part of the service role key for debugging
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('Service Role Key (partial): ', serviceRoleKey ? serviceRoleKey.substring(0, 5) + '...' + serviceRoleKey.substring(serviceRoleKey.length - 5) : 'Not found');

  const { email, password, name, role, phoneNumber, position, id_number } = req.body;

  if (!email || !password || !name || !role || !id_number) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Create user in Supabase Auth using admin privileges
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm email
    });

    if (userError) {
      console.error('Supabase user creation error:', userError);
      return res.status(500).json({ error: userError.message });
    }

    if (!userData || !userData.user) {
      return res.status(500).json({ error: 'User data not returned after creation.' });
    }

    // 2. Insert user profile into the 'profiles' table
    const { error: profileError } = await supabaseAdmin.from('profiles').insert([
      {
        id: userData.user.id,
        name,
        role,
        email,
        phone_number: phoneNumber,
        position,
        id_number, // Include id_number here
      },
    ]);

    if (profileError) {
      console.error('Supabase profile insert error:', profileError);
      // If profile insertion fails, you might want to consider deleting the user created in auth
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return res.status(500).json({ error: profileError.message });
    }

    return res.status(200).json({ message: 'Employee and profile created successfully!', user: userData.user });

  } catch (error: any) {
    console.error('Unexpected error during employee creation:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
} 