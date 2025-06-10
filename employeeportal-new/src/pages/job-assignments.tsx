import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  SelectChangeEvent,
  Checkbox,
  ListItemText
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';
import { useNotifications } from '../contexts/NotificationContext';
import type { Job } from '../contexts/JobContext';

// Mock data for users (to be replaced with real user data)
const users = [
  { id: '1', name: 'Alice', role: 'regular', position: 'Technician' },
  { id: '2', name: 'Bob', role: 'regular', position: 'Driver' },
  { id: '3', name: 'Carol', role: 'regular', position: 'Driver' },
  { id: '4', name: 'Dave', role: 'manager', position: 'Manager' },
  { id: '5', name: 'Eve', role: 'admin', position: 'Admin' },
];

const drivers = users.filter(u => u.position === 'Driver');
const managers = users.filter(u => u.position === 'Manager' || u.role === 'admin');
const personnel = users.filter(u => u.position !== 'Driver' && u.position !== 'Manager' && u.role !== 'admin');

interface FormData {
  title: string;
  natureOfWork: string;
  jobOrderNumber: string;
  siteAddress: string;
  timeStart: string;
  timeEnd: string;
  supervisorId: string;
  personnelIds: string[];
  driverId: string;
}

const initialFormData: FormData = {
  title: '',
  natureOfWork: '',
  jobOrderNumber: '',
  siteAddress: '',
  timeStart: '',
  timeEnd: '',
  supervisorId: '',
  personnelIds: [],
  driverId: ''
};

const JobAssignments: React.FC = () => {
  const { user } = useAuth();
  const { assignJob, jobs } = useJobs();
  const { showNotification } = useNotifications();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Only allow managers, supervisors, or admins
  const allowedRoles = ['manager', 'supervisor', 'admin'];

  // Prevent driver double-booking
  const isDriverBooked = (driverId: string, start: string, end: string) => {
    if (!driverId || !start || !end) return false;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return jobs.some(job => {
      if (job.driverId !== driverId) return false;
      const js = new Date(job.timeStart).getTime();
      const je = new Date(job.timeEnd).getTime();
      // Overlap check
      return (s < je && e > js);
    });
  };

  if (!user) {
    return <Typography>Please log in to assign jobs.</Typography>;
  }
  if (!allowedRoles.includes(user.role)) {
    return <Typography>Only managers, supervisors, or admins can assign jobs.</Typography>;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      setSnackbar({
        open: true,
        message: 'You must be logged in to assign jobs',
        severity: 'error'
      });
      return;
    }

    // Prevent driver double-booking
    if (isDriverBooked(formData.driverId, formData.timeStart, formData.timeEnd)) {
      setSnackbar({
        open: true,
        message: 'Driver is already booked for this time slot.',
        severity: 'error'
      });
      return;
    }

    try {
      const newJob: Omit<Job, 'id' | 'status' | 'acknowledgedBy' | 'createdAt' | 'updatedAt'> = {
        ...formData,
        description: formData.natureOfWork || '', // fallback if natureOfWork is missing
      };

      const jobId = await assignJob(newJob);
      
      showNotification({
        message: `Job assigned successfully: ${formData.title}`,
        type: 'success',
        link: `/jobs/${jobId}`,
        metadata: { jobId, type: 'job_assigned' }
      });

      setFormData(initialFormData);
      setSnackbar({
        open: true,
        message: 'Job assigned successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to assign job',
        severity: 'error'
      });
    }
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
          Job Assignments
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Create and manage job assignments
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nature of Work"
                name="natureOfWork"
                value={formData.natureOfWork}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Order Number"
                name="jobOrderNumber"
                value={formData.jobOrderNumber}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Site Address"
                name="siteAddress"
                value={formData.siteAddress}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Start Time"
                name="timeStart"
                value={formData.timeStart}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="End Time"
                name="timeEnd"
                value={formData.timeEnd}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Supervisor/Manager</InputLabel>
                <Select
                  name="supervisorId"
                  value={formData.supervisorId}
                  onChange={handleSelectChange}
                  label="Supervisor/Manager"
                >
                  <MenuItem value="">Select Supervisor/Manager</MenuItem>
                  {managers.map(m => (
                    <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Personnel</InputLabel>
                <Select
                  name="personnelIds"
                  multiple
                  value={formData.personnelIds}
                  onChange={e => setFormData(prev => ({ ...prev, personnelIds: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value }))}
                  renderValue={selected => (selected as string[]).map(id => users.find(u => u.id === id)?.name).join(', ')}
                  label="Personnel"
                >
                  {personnel.map(p => (
                    <MenuItem key={p.id} value={p.id}>
                      <Checkbox checked={formData.personnelIds.indexOf(p.id) > -1} />
                      <ListItemText primary={p.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Assigned Driver</InputLabel>
                <Select
                  name="driverId"
                  value={formData.driverId}
                  onChange={handleSelectChange}
                  label="Assigned Driver"
                >
                  <MenuItem value="">Select Driver</MenuItem>
                  {drivers.map(d => (
                    <MenuItem key={d.id} value={d.id} disabled={isDriverBooked(d.id, formData.timeStart, formData.timeEnd)}>
                      {d.name} {isDriverBooked(d.id, formData.timeStart, formData.timeEnd) ? '(Booked)' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" disabled={isDriverBooked(formData.driverId, formData.timeStart, formData.timeEnd)}>
                Assign Job
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default JobAssignments;
