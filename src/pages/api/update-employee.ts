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

    // Update the profile
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error in update-employee:', error);
    return res.status(500).json({ error: error.message });
  }
} 