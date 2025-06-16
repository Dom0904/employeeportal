import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

let supabaseAdmin: any; // Using 'any' for now to bypass strict typing during debugging

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('API Route: Initializing Supabase admin client...');
  console.log('API Route: Supabase URL (partial): ', supabaseUrl ? supabaseUrl.substring(0, 5) + '...' : 'Not found');
  console.log('API Route: Service Role Key (partial): ', serviceRoleKey ? serviceRoleKey.substring(0, 5) + '...' + serviceRoleKey.substring(serviceRoleKey.length - 5) : 'Not found');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables for admin client.');
  }

  supabaseAdmin = createClient(
    supabaseUrl,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } } // Disable session features for server-side calls
  );
  console.log('API Route: Supabase admin client initialized.');
} catch (initError: any) {
  console.error('API Route: Error initializing Supabase admin client:', initError);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Check if supabaseAdmin was successfully initialized
  if (!supabaseAdmin) {
    console.error('API Route: Supabase admin client not initialized, cannot proceed.');
    return res.status(500).json({ error: 'Server configuration error: Supabase admin client not ready.' });
  }

  const { email, password, name, role, phoneNumber, position, id_number } = req.body;

  if (!email || !password || !name || !role || !id_number) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log('API Route: Attempting to create user in Supabase Auth...');
    console.log('API Route: Creating user with email:', email, 'and password: [REDACTED]');
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (userError) {
      console.error('API Route: Supabase user creation error:', userError.message, userError);
      return res.status(500).json({ error: userError.message });
    }

    if (!userData || !userData.user) {
      console.error('API Route: User data not returned after creation.');
      return res.status(500).json({ error: 'User data not returned after creation.' });
    }

    console.log('API Route: User created in Auth. Attempting to insert profile...');

    // Ensure optional fields are explicitly null if empty strings
    const phoneNumberToInsert = phoneNumber === '' ? null : phoneNumber;
    const positionToInsert = position === '' ? null : position;
    const nameToInsert = name === null || name === undefined || name === '' ? '' : name; // Ensure name is always a non-null string

    const profileDataToInsert = {
      id: userData.user.id,
      name: nameToInsert,
      role,
      email,
      phone_number: phoneNumberToInsert,
      position: positionToInsert,
      id_number,
    };
    console.log('API Route: Profile data to insert:', profileDataToInsert);
    console.log('API Route: Value of nameToInsert before insert:', nameToInsert);

    const { error: profileError } = await supabaseAdmin.from('profiles').insert([
      profileDataToInsert,
    ]);

    if (profileError) {
      console.error('API Route: Supabase profile insert error:', profileError.message, profileError);
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return res.status(500).json({ error: profileError.message });
    }

    console.log('API Route: Employee and profile created successfully!');
    return res.status(200).json({ message: 'Employee and profile created successfully!', user: userData.user });

  } catch (error: any) {
    console.error('API Route: Unexpected error during employee creation:', error.message || error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
} 