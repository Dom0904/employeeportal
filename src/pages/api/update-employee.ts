import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Initialize Supabase admin client inside the handler to ensure environment variables are loaded
  let supabaseAdmin: any; // Use 'any' for now to bypass strict typing during debugging
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('API Route (update-employee): Initializing Supabase admin client inside handler...');
    console.log('API Route (update-employee): Supabase URL (partial): ', supabaseUrl ? supabaseUrl.substring(0, 5) + '...' : 'Not found');
    console.log('API Route (update-employee): Service Role Key (partial): ', serviceRoleKey ? serviceRoleKey.substring(0, 5) + '...' + serviceRoleKey.substring(serviceRoleKey.length - 5) : 'Not found');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables for admin client.');
    }

    supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    console.log('API Route (update-employee): Supabase admin client initialized successfully inside handler.');
  } catch (initError: any) {
    console.error('API Route (update-employee): Error initializing Supabase admin client inside handler:', initError);
    return res.status(500).json({ error: 'Server configuration error: Supabase admin client not ready for update.' });
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, updates } = req.body;

    if (!id || !updates) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate the updates object
    const validUpdates = {
      name: updates.name,
      position: updates.position,
      department: updates.department,
      email: updates.email,
      phone_number: updates.phone_number,
      last_active: new Date().toISOString()
    };

    // Update the profile using supabaseAdmin
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(validUpdates)
      .eq('id', id)
      .select('id, id_number, name, position, department, last_active, email, phone_number')
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error in update-employee:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 