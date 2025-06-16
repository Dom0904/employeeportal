import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

interface JobContextType {
  jobs: Job[];
  assignJob: (jobData: Omit<Job, 'id' | 'status' | 'acknowledged_at' | 'created_at' | 'updated_at'>) => Promise<Job>;
  acknowledgeJob: (jobId: string, userId: string) => void;
  updateJobStatus: (jobId: string, status: Job['status']) => void;
  getJobsByUser: (userId: string) => Job[];
  getJobById: (jobId: string) => Job | undefined;
  getJobsByDateRange: (startDate: Date, endDate: Date) => Job[];
  getJobsByProject: (projectId: string) => Job[];
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

export interface Job {
  id: string;
  title: string;
  description: string;
  natureOfWork?: string;
  jobOrderNumber?: string;
  siteAddress?: string;
  timeStart?: string;
  timeEnd?: string;
  supervisorId?: string;
  personnelIds?: string[];
  driver_id?: string | null;
  project_id?: string | null;
  status?: 'pending' | 'acknowledged' | 'in-progress' | 'completed' | 'cancelled';
  acknowledged_at?: string | null;
  created_at?: string;
  updated_at?: string;
  color?: string;
}

export const JobProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { /* user */ } = useAuth();
  const { showNotification } = useNotifications();
  const [jobs, setJobs] = useState<Job[]>([]);

  // Fetch jobs from Supabase on mount
  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        showNotification({ type: 'error', message: 'Failed to fetch jobs' });
        return;
      }
      setJobs((data || []) as Job[]);
    };
    fetchJobs();
  }, [showNotification]);

  const assignJob = useCallback(async (jobData: Omit<Job, 'id' | 'status' | 'acknowledged_at' | 'created_at' | 'updated_at'>) => {
    const newJob: Job = {
      id: uuidv4(),
      title: jobData.title,
      description: jobData.description,
      natureOfWork: jobData.natureOfWork,
      jobOrderNumber: jobData.jobOrderNumber,
      siteAddress: jobData.siteAddress,
      timeStart: jobData.timeStart,
      timeEnd: jobData.timeEnd,
      supervisorId: jobData.supervisorId,
      personnelIds: jobData.personnelIds,
      driver_id: jobData.driver_id || null,
      project_id: jobData.project_id || null,
      status: 'pending',
      acknowledged_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      color: getRandomColor(),
    };
    const { error } = await supabase.from('jobs').insert([newJob]);
    if (error) {
      showNotification({ type: 'error', message: 'Failed to assign job' });
      throw error;
    }
    setJobs(prevJobs => [newJob, ...prevJobs]);
    // Notify assigned personnel
    (jobData.personnelIds || []).forEach((personId: string) => {
      showNotification({
        message: `New job assigned: ${newJob.title}`,
        type: 'info',
        link: `/jobs/${newJob.id}`,
        metadata: { jobId: newJob.id, type: 'job_assigned' }
      });
    });
    // Notify the driver if assigned
    if (jobData.driver_id) {
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
    if (!job || job.acknowledged_at) return;

    const updatedJob: Job = {
      ...job,
      acknowledged_at: new Date().toISOString(),
      status: 'acknowledged',
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('jobs').update({
      acknowledged_at: updatedJob.acknowledged_at,
      status: updatedJob.status,
      updated_at: updatedJob.updated_at,
    }).eq('id', jobId);
    if (error) {
      showNotification({ type: 'error', message: 'Failed to acknowledge job' });
      return;
    }
    setJobs(prevJobs => prevJobs.map((j: Job) => j.id === jobId ? updatedJob : j));
    
    showNotification({
      message: `Job acknowledged successfully: ${job.title}`,
      type: 'success',
      link: `/job-schedule?jobId=${jobId}`,
      metadata: { jobId, type: 'job_acknowledged' }
    });
  }, [jobs, showNotification]);

  const updateJobStatus = useCallback(async (jobId: string, status: Job['status']) => {
    const job = jobs.find((j: Job) => j.id === jobId);
    if (!job) return;
    const updatedJob = { ...job, status, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('jobs').update({
      status,
      updated_at: updatedJob.updated_at,
    }).eq('id', jobId);
    if (error) {
      showNotification({ type: 'error', message: 'Failed to update job status' });
      return;
    }
    setJobs(prevJobs => prevJobs.map((j: Job) => j.id === jobId ? updatedJob : j));
  }, [jobs, showNotification]);

  const getJobsByUser = useCallback((userId: string) => {
    return jobs.filter(job => 
      (job.personnelIds ?? []).includes(userId) || 
      job.driver_id === userId ||
      job.supervisorId === userId
    );
  }, [jobs]);

  const getJobById = useCallback((jobId: string) => {
    return jobs.find(job => job.id === jobId);
  }, [jobs]);

  const getJobsByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return jobs.filter(job => {
      const jobStart = new Date(job.timeStart !== undefined ? job.timeStart : 0);
      const jobEnd = new Date(job.timeEnd !== undefined ? job.timeEnd : 0);
      return (
        (jobStart >= startDate && jobStart <= endDate) ||
        (jobEnd >= startDate && jobEnd <= endDate) ||
        (jobStart <= startDate && jobEnd >= endDate)
      );
    });
  }, [jobs]);

  const getJobsByProject = useCallback((projectId: string) => {
    return jobs.filter(job => job.project_id === projectId);
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
        getJobsByProject,
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
