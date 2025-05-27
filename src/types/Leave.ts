export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  userId: string;
  userName?: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}
