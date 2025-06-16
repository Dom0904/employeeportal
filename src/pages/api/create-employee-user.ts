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
    const newEmployeeId = randomUUID(); // Generate a new UUID for the employee ID

    // Ensure optional fields are explicitly null if empty strings
    const phoneNumberToInsert = phoneNumber === '' ? null : phoneNumber;
    const positionToInsert = position === '' ? null : position;
    const nameToInsert = name === null || name === undefined || name === '' ? '' : name;

    const employeeDataToInsert = {
      id: newEmployeeId,
      name: nameToInsert,
      role,
      email,
      phone_number: phoneNumberToInsert,
      position: positionToInsert,
      id_number,
    };

    console.log('API Route: Attempting to insert into employee_list:', employeeDataToInsert);

    const { error: insertError } = await supabaseAdmin.from('employee_list').insert([
      employeeDataToInsert,
    ]);

    if (insertError) {
      console.error('API Route: Error inserting into employee_list:', insertError.message, insertError);
      return res.status(500).json({ error: insertError.message || 'Failed to add employee to list' });
    }

    console.log('API Route: Employee added to list successfully!');
    return res.status(200).json({ message: 'Employee added to list successfully!', employeeId: newEmployeeId });

  } catch (error: any) {
    console.error('API Route: Unexpected error during employee addition:', error.message || error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
} 