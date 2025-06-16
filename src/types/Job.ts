export interface Job {
  id: string;
  title: string;
  description: string;
  natureOfWork: string;
  jobOrderNumber: string;
  siteAddress: string;
  timeStart: string;
  timeEnd: string;
  supervisorId: string;
  personnelIds: string[];
  driver_id: string | null;
  project_id: string | null;
  status: 'pending' | 'acknowledged' | 'in-progress' | 'completed' | 'cancelled';
  acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
  color?: string;
}

export type JobStatus = Job['status'];
