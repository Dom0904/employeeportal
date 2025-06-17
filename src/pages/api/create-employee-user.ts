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
    let authUserId: string;
    let initialPassword = id_number; // Default initial password

    // First, check if a user with this email already exists
    const { data: existingUserData, error: existingUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (existingUserError && existingUserError.message !== 'User not found') {
      console.error('API Route: Error checking for existing user:', existingUserError);
      return res.status(500).json({ 
        error: `Failed to check for existing user: ${existingUserError.message}`,
        details: existingUserError
      });
    }

    if (existingUserData?.user) {
      console.log('API Route: Existing Auth user found with email:', email, 'ID:', existingUserData.user.id);
      authUserId = existingUserData.user.id;
      // If user exists, we don't create a new password, so initialPassword remains id_number (could be anything, won't be used for new user creation)
    } else {
      // No existing user, create a new one
      console.log('API Route: Creating Supabase Auth user...');
      console.log('API Route: Using service role key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing');
      
      console.log('API Route: Inspecting supabaseAdmin.auth:', supabaseAdmin.auth);
      console.log('API Route: Inspecting supabaseAdmin.auth.admin:', supabaseAdmin.auth.admin);

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
        console.error('API Route: Detailed auth error during new user creation:', {
          message: userError.message,
          status: userError.status,
          name: userError.name,
          stack: userError.stack
        });
        return res.status(500).json({ 
          error: `Failed to create new auth user: ${userError.message}`,
          details: userError
        });
      }

      if (!userData?.user?.id) {
        console.error('API Route: No user ID returned from new auth creation');
        return res.status(500).json({ error: 'Failed to create new auth user: No user ID returned' });
      }

      authUserId = userData.user.id;
      console.log('API Route: New Auth user created successfully:', {
        id: authUserId,
        email: userData.user.email,
        confirmed: userData.user.email_confirmed_at
      });
    }

    // Introduce a small delay to allow for database triggers to complete (e.g., profile creation trigger)
    await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
    console.log('API Route: Delay completed, proceeding with profile update.');

    // After the auth user is created (or found), upsert their profile in the 'profiles' table.
    // We are using upsert to handle cases where a profile might be automatically created by a database trigger.
    console.log('API Route: Attempting to upsert profile for ID:', authUserId, 'with data:', { name, role, email, phone_number: phoneNumber, position, id_number });
    const { data: upsertData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: authUserId,
          name,
          role,
          email,
          phone_number: phoneNumber,
          position,
          id_number
        },
        { onConflict: 'id' } // Explicitly state conflict on the 'id' primary key
      )
      .select(); // Select the data after upsert for debugging

    if (profileError) {
      console.error('API Route: Profile upsert error:', profileError);
      // Clean up the created auth user if profile upsert fails for a newly created user.
      if (!existingUserData?.user) { 
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        console.log('API Route: Cleaned up newly created auth user due to profile upsert error.');
      }
      return res.status(500).json({ 
        error: `Failed to create profile: ${profileError.message}`,
        details: profileError
      });
    }

    console.log('API Route: Profile upsert successful for ID:', authUserId, 'Upserted Data:', upsertData);
    return res.status(200).json({ 
      message: 'Employee created successfully',
      initialPassword: initialPassword
    });

  } catch (error: any) {
    console.error('API Route: Unexpected error during employee creation:', error);
    return res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
} 