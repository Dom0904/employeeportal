import React, { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { JobList } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';

const JobsAssigned = () => {
  const { user } = useAuth();
  const { jobs, getJobsByUser } = useJobs();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Get jobs assigned to the current user
  const userJobs = user ? getJobsByUser(user.id) : [];

  // Organize jobs by status
  const jobsByStatus = {
    upcoming: userJobs.filter(job => 
      (job.status === 'pending' || job.status === 'acknowledged') &&
      (job.personnelIds.includes(user?.id || '') || job.driverId === user?.id)
    ),
    inProgress: userJobs.filter(job => 
      job.status === 'in-progress' &&
      (job.personnelIds.includes(user?.id || '') || job.driverId === user?.id)
    ),
    completed: userJobs.filter(job => 
      job.status === 'completed' &&
      (job.personnelIds.includes(user?.id || '') || job.driverId === user?.id)
    )
  };

  return (
    <Box>
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3,
          borderTop: '4px solid',
          borderColor: 'primary.main'
        }}
      >
        <Typography variant="h5" gutterBottom color="primary.main">
          Jobs Assigned to You
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          View and acknowledge your assigned jobs
        </Typography>
      </Paper>

      {/* Display jobs that need acknowledgment */}
      <JobList 
        showAcknowledgmentOnly={true}
        userId={user?.id || ''}
        jobsByStatus={jobsByStatus}
        selectedJobId={selectedJobId}
        onJobSelect={setSelectedJobId}
      />
    </Box>
  );
};

export default JobsAssigned;
