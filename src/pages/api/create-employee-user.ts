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
    const employeeDataToInsert = {
      id: userData.user.id, // Use the auth user's ID
      name: name.trim(),
      role,
      email,
      phone_number: phoneNumber?.trim() || null,
      position: position?.trim() || null,
      id_number: id_number.trim(),
    };

    console.log('API Route: Creating employee record:', employeeDataToInsert);
    const { error: insertError } = await supabaseAdmin.from('employee_list').insert([
      employeeDataToInsert,
    ]);

    if (insertError) {
      // If employee record creation fails, delete the auth user
      console.error('API Route: Error creating employee record:', insertError);
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return res.status(500).json({ error: `Failed to create employee record: ${insertError.message}` });
    }

    console.log('API Route: Employee created successfully!');
    return res.status(200).json({ 
      message: 'Employee created successfully!',
      userId: userData.user.id,
      email: userData.user.email,
      initialPassword: id_number // Send back the initial password for admin reference
    });

  } catch (error: any) {
    console.error('API Route: Unexpected error during employee creation:', error);
    return res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
} 