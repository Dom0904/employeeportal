import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let supabaseAdmin: any;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables for admin client.');
    }

    supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  } catch (initError: any) {
    console.error('API Route (delete-employee): Error initializing Supabase admin client:', initError);
    return res.status(500).json({ error: 'Server configuration error: Supabase admin client not ready.' });
  }

  const { employeeId, adminEmail, adminPassword } = req.body;

  if (!employeeId || !adminEmail || !adminPassword) {
    return res.status(400).json({ error: 'Missing required fields for deletion.' });
  }

  try {
    // Verify the admin's password using signInWithPassword with the admin client
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (signInError) {
      console.error('API Route (delete-employee): Admin password verification failed:', signInError);
      return res.status(401).json({ error: 'Unauthorized: Incorrect password.' });
    }

    console.log('API Route (delete-employee): Attempting to delete user with ID:', employeeId);
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(employeeId);

    if (deleteUserError) {
      console.error('API Route (delete-employee): Detailed error deleting user:', deleteUserError);
      return res.status(500).json({ error: deleteUserError.message || 'Failed to delete employee user.', details: deleteUserError });
    }

    console.log('API Route (delete-employee): User deleted successfully.', employeeId);
    // Optionally, delete the profile row as well if it's not automatically handled by a trigger/cascade
    // For now, assuming foreign key constraint handles it, as per previous discussion.

    return res.status(200).json({ message: 'Employee deleted successfully.' });

  } catch (error: any) {
    console.error('API Route (delete-employee): Unexpected error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
} 