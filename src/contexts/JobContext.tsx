import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

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

interface JobContextType {
  jobs: Job[];
  assignJob: (jobData: Omit<Job, 'id' | 'status' | 'acknowledgedBy' | 'createdAt' | 'updatedAt'>) => Promise<Job>;
  acknowledgeJob: (jobId: string, userId: string) => void;
  updateJobStatus: (jobId: string, status: Job['status']) => void;
  getJobsByUser: (userId: string) => Job[];
  getJobById: (jobId: string) => Job | undefined;
  getJobsByDateRange: (startDate: Date, endDate: Date) => Job[];
}

const JobContext = createContext<JobContextType | undefined>(undefined);

// Generate a random color for the job
const getRandomColor = () => {
  const colors = [
    '#2196F3', // blue
    '#4CAF50', // green
    '#FF9800', // orange
    '#9C27B0', // purple
    '#F44336', // red
    '#00BCD4', // cyan
    '#FFC107', // amber
    '#795548', // brown
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const JobProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showNotification } = useNotifications();
  const [jobs, setJobs] = useState<Job[]>([]);

  // Fetch jobs from Supabase on mount
  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase.from('jobs').select('*');
      if (error) {
        showNotification({ type: 'error', message: 'Failed to fetch jobs' });
        return;
      }
      setJobs((data || []) as Job[]);
    };
    fetchJobs();
  }, [showNotification]);

  const assignJob = useCallback(async (jobData: Omit<Job, 'id' | 'status' | 'acknowledgedBy' | 'createdAt' | 'updatedAt'>) => {
    const newJob: Job = {
      ...jobData,
      id: uuidv4(),
      status: 'pending',
      acknowledgedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      color: getRandomColor(),
    };
    const { error } = await supabase.from('jobs').insert([newJob]);
    if (error) {
      showNotification({ type: 'error', message: 'Failed to assign job' });
      throw error;
    }
    setJobs(prevJobs => [newJob, ...prevJobs]);
    // Notify assigned personnel
    jobData.personnelIds.forEach(personId => {
      showNotification({
        message: `New job assigned: ${newJob.title}`,
        type: 'info',
        link: `/jobs/${newJob.id}`,
        metadata: { jobId: newJob.id, type: 'job_assigned' }
      });
    });
    // Notify the driver if assigned
    if (jobData.driverId) {
      showNotification({
        message: `You have been assigned as driver for job: ${newJob.title}`,
        type: 'info',
        link: `/jobs/${newJob.id}`,
        metadata: { jobId: newJob.id, type: 'driver_assigned' }
      });
    }
    return newJob;
  }, [showNotification]);

  const acknowledgeJob = useCallback(async (jobId: string, userId: string) => {
    const job = jobs.find((j: Job) => j.id === jobId);
    if (!job || job.acknowledgedBy.includes(userId)) return;
    const updatedAcknowledgedBy = [...job.acknowledgedBy, userId];
    const allPersonnelAcknowledged = job.personnelIds.every((id: string) => updatedAcknowledgedBy.includes(id));
    const updatedJob = {
      ...job,
      acknowledgedBy: updatedAcknowledgedBy,
      status: allPersonnelAcknowledged ? 'acknowledged' : job.status,
      updatedAt: new Date().toISOString(),
    };
    const { error } = await supabase.from('jobs').update({
      acknowledgedBy: updatedAcknowledgedBy,
      status: updatedJob.status,
      updatedAt: updatedJob.updatedAt,
    }).eq('id', jobId);
    if (error) {
      showNotification({ type: 'error', message: 'Failed to acknowledge job' });
      return;
    }
    setJobs(prevJobs => prevJobs.map((j: Job) => j.id === jobId ? updatedJob : j));
    if (allPersonnelAcknowledged) {
      showNotification({
        message: `All personnel have acknowledged job: ${job.title}`,
        type: 'success',
        link: `/job-schedule?jobId=${jobId}`,
        metadata: { jobId, type: 'job_acknowledged' }
      });
    }
  }, [jobs, showNotification]);

  const updateJobStatus = useCallback(async (jobId: string, status: Job['status']) => {
    const job = jobs.find((j: Job) => j.id === jobId);
    if (!job) return;
    const updatedJob = { ...job, status, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('jobs').update({
      status,
      updatedAt: updatedJob.updatedAt,
    }).eq('id', jobId);
    if (error) {
      showNotification({ type: 'error', message: 'Failed to update job status' });
      return;
    }
    setJobs(prevJobs => prevJobs.map((j: Job) => j.id === jobId ? updatedJob : j));
  }, [jobs, showNotification]);

  const getJobsByUser = useCallback((userId: string) => {
    return jobs.filter(job => 
      job.personnelIds.includes(userId) || 
      job.driverId === userId || 
      job.supervisorId === userId
    );
  }, [jobs]);

  const getJobById = useCallback((jobId: string) => {
    return jobs.find(job => job.id === jobId);
  }, [jobs]);

  const getJobsByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return jobs.filter(job => {
      const jobStart = new Date(job.timeStart);
      const jobEnd = new Date(job.timeEnd);
      return (
        (jobStart >= startDate && jobStart <= endDate) ||
        (jobEnd >= startDate && jobEnd <= endDate) ||
        (jobStart <= startDate && jobEnd >= endDate)
      );
    });
  }, [jobs]);

  return (
    <JobContext.Provider
      value={{
        jobs,
        assignJob,
        acknowledgeJob,
        updateJobStatus,
        getJobsByUser,
        getJobById,
        getJobsByDateRange,
      }}
    >
      {children}
    </JobContext.Provider>
  );
};

export const useJobs = () => {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
};
