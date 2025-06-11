export interface Job {
  id: string;
  title: string;
  description: string;
  nature_of_work: string;
  job_order_number: string;
  site_address: string;
  time_start: string;
  time_end: string;
  supervisor_id: string;
  personnel_ids: string[];
  driver_id: string | null;
  project_id: string | null;
  status: 'pending' | 'acknowledged' | 'in-progress' | 'completed' | 'cancelled';
  acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
  color?: string;
}

export type JobStatus = Job['status'];
