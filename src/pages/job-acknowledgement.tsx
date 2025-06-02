import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import { useJobs } from '../contexts/JobContext';
import { useAuth } from '../contexts/AuthContext';
import { Job } from '../types/Job';

const JobAcknowledgement: React.FC = () => {
  const { user } = useAuth();
  const { jobs, acknowledgeJob } = useJobs();
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Filter jobs assigned to the user that need acknowledgement
  const jobsToAcknowledge: Job[] = jobs.filter(job => {
    if (!user) return false;
    const isAssigned = job.personnelIds.includes(user.id) || job.driverId === user.id;
    const needsAck = !job.acknowledgedBy.includes(user.id);
    const isActive = job.status === 'pending' || job.status === 'acknowledged';
    return isAssigned && needsAck && isActive;
  });

  const handleAcknowledge = async (jobId: string) => {
    setAcknowledging(jobId);
    try {
      await acknowledgeJob(jobId, user!.id);
      setSnackbar({ open: true, message: 'Job acknowledged successfully.', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to acknowledge job.', severity: 'error' });
    } finally {
      setAcknowledging(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Job Acknowledgement
      </Typography>
      {jobsToAcknowledge.length === 0 ? (
        <Typography>No jobs require your acknowledgement at this time.</Typography>
      ) : (
        <Grid container spacing={2}>
          {jobsToAcknowledge.map(job => (
            <Grid item xs={12} md={6} key={job.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{job.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {job.description}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Start:</strong> {new Date(job.timeStart).toLocaleString()}<br />
                    <strong>End:</strong> {new Date(job.timeEnd).toLocaleString()}
                  </Typography>
                  <Button
                    sx={{ mt: 2 }}
                    variant="contained"
                    color="primary"
                    disabled={acknowledging === job.id}
                    onClick={() => handleAcknowledge(job.id)}
                  >
                    {acknowledging === job.id ? 'Acknowledging...' : 'Acknowledge'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default JobAcknowledgement;
