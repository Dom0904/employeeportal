import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LeaveRequest, LeaveStatus } from '../types/Leave';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabaseClient';

interface LeaveContextType {
  leaveRequests: LeaveRequest[];
  requestLeave: (leave: Omit<LeaveRequest, 'id' | 'status' | 'reviewedBy' | 'reviewedAt' | 'createdAt'>) => void;
  approveLeave: (id: string, reviewerId: string) => void;
  rejectLeave: (id: string, reviewerId: string) => void;
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export const LeaveProvider = ({ children }: { children: ReactNode }) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  // Fetch leave requests from Supabase on mount
  React.useEffect(() => {
    const fetchLeaveRequests = async () => {
      const { data, error } = await supabase.from('leave_requests').select('*');
      if (error) {
        // Optionally: show notification
        return;
      }
      setLeaveRequests(data || []);
    };
    fetchLeaveRequests();
  }, []);

  const requestLeave = async (leave: Omit<LeaveRequest, 'id' | 'status' | 'reviewedBy' | 'reviewedAt' | 'createdAt'>) => {
    const newLeave: LeaveRequest = {
      ...leave,
      id: uuidv4(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const { error } = await supabase.from('leave_requests').insert([newLeave]);
    if (error) {
      // Optionally: show notification
      return;
    }
    setLeaveRequests(prev => [newLeave, ...prev]);
  };

  const approveLeave = async (id: string, reviewerId: string) => {
    const reviewedAt = new Date().toISOString();
    const { error } = await supabase.from('leave_requests').update({ status: 'approved', reviewedBy: reviewerId, reviewedAt }).eq('id', id);
    if (error) return;
    setLeaveRequests(prev => prev.map(lr => lr.id === id ? { ...lr, status: 'approved', reviewedBy: reviewerId, reviewedAt } : lr));
  };

  const rejectLeave = async (id: string, reviewerId: string) => {
    const reviewedAt = new Date().toISOString();
    const { error } = await supabase.from('leave_requests').update({ status: 'rejected', reviewedBy: reviewerId, reviewedAt }).eq('id', id);
    if (error) return;
    setLeaveRequests(prev => prev.map(lr => lr.id === id ? { ...lr, status: 'rejected', reviewedBy: reviewerId, reviewedAt } : lr));
  };

  return (
    <LeaveContext.Provider value={{ leaveRequests, requestLeave, approveLeave, rejectLeave }}>
      {children}
    </LeaveContext.Provider>
  );
};

export const useLeave = () => {
  const ctx = useContext(LeaveContext);
  if (!ctx) throw new Error('useLeave must be used within a LeaveProvider');
  return ctx;
};
