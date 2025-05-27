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
  driverId: string;
  status: 'pending' | 'acknowledged' | 'in-progress' | 'completed' | 'cancelled';
  acknowledgedBy: string[];
  createdAt: string;
  updatedAt: string;
  color?: string;
}

export type JobStatus = Job['status'];
