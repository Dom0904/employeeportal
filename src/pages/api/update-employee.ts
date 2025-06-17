import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // Update the profile
    const { data, error } = await supabase
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