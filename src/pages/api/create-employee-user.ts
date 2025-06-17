import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto'; // Import randomUUID for generating IDs

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

  const { email, name, role, phoneNumber, position, id_number } = req.body;

  console.log('API Route: Received request body:', req.body);

  // Validate required fields with detailed logging
  if (!email) {
    console.log('API Route: Missing email field');
    return res.status(400).json({ error: 'Missing required field: email' });
  }
  if (!name) {
    console.log('API Route: Missing name field');
    return res.status(400).json({ error: 'Missing required field: name' });
  }
  if (!role) {
    console.log('API Route: Missing role field');
    return res.status(400).json({ error: 'Missing required field: role' });
  }
  if (!id_number) {
    console.log('API Route: Missing id_number field');
    return res.status(400).json({ error: 'Missing required field: id_number' });
  }

  try {
    // First, create the Supabase Auth user
    console.log('API Route: Creating Supabase Auth user...');
    console.log('API Route: Using service role key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing');
    
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: id_number, // Use ID number as initial password
      email_confirm: true,
      user_metadata: {
        name,
        role,
        id_number
      }
    });

    if (userError) {
      console.error('API Route: Detailed auth error:', {
        message: userError.message,
        status: userError.status,
        name: userError.name,
        stack: userError.stack
      });
      return res.status(500).json({ 
        error: `Failed to create auth user: ${userError.message}`,
        details: userError
      });
    }

    if (!userData?.user?.id) {
      console.error('API Route: No user ID returned from auth creation');
      return res.status(500).json({ error: 'Failed to create auth user: No user ID returned' });
    }

    console.log('API Route: Auth user created successfully:', {
      id: userData.user.id,
      email: userData.user.email,
      confirmed: userData.user.email_confirmed_at
    });

    // Then, create the employee record
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: userData.user.id,
          name,
          role,
          email,
          phone_number: phoneNumber,
          position,
          id_number
        }
      ]);

    if (profileError) {
      console.error('API Route: Profile creation error:', profileError);
      // Clean up the created user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return res.status(500).json({ 
        error: `Failed to create profile: ${profileError.message}`,
        details: profileError
      });
    }

    return res.status(200).json({ 
      message: 'Employee created successfully',
      initialPassword: id_number
    });

  } catch (error: any) {
    console.error('API Route: Unexpected error during employee creation:', error);
    return res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
} 