import React, { useState, useEffect } from 'react';
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
  ListItemText,
  useTheme,
  Chip
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';
import { useProject } from '../contexts/ProjectContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useRouter } from 'next/router';
import type { Job } from '../types/Job';
import type { User } from '../contexts/AuthContext';

// Remove mock data for users
// const users = [
//   { id: '1', name: 'Alice', role: 'regular', position: 'Technician' },
//   { id: '2', name: 'Bob', role: 'regular', position: 'Driver' },
//   { id: '3', name: 'Carol', role: 'regular', position: 'Driver' },
//   { id: '4', name: 'Dave', role: 'manager', position: 'Manager' },
//   { id: '5', name: 'Eve', role: 'admin', position: 'Admin' },
// ];

// const drivers = users.filter(u => u.position === 'Driver');
// const managers = users.filter(u => u.position === 'Manager' || u.role === 'admin');
// const personnel = users.filter(u => u.position !== 'Driver' && u.position !== 'Manager' && u.role !== 'admin');

interface FormData {
  title: string;
  nature_of_work: string;
  job_order_number: string;
  site_address: string;
  time_start: string;
  time_end: string;
  supervisor_id: string;
  personnel_ids: string[];
  driver_id: string | null;
  project_id: string | null;
}

const initialFormData: FormData = {
  title: '',
  nature_of_work: '',
  job_order_number: '',
  site_address: '',
  time_start: '',
  time_end: '',
  supervisor_id: '',
  personnel_ids: [],
  driver_id: null,
  project_id: null
};

const JobAssignments: React.FC = () => {
  const { user, getAllUsers } = useAuth();
  const { assignJob, jobs } = useJobs();
  const { projects } = useProject();
  const { showNotification } = useNotifications();
  const router = useRouter();
  const theme = useTheme();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = await getAllUsers();
      setAllUsers(fetchedUsers);
    };
    fetchUsers();
  }, [getAllUsers]);

  // Filter users based on their roles/positions (assuming we fetch positions from profiles table)
  const drivers = allUsers.filter(u => u.position === 'Driver');
  const managers = allUsers.filter(u => u.role === 'manager' || u.role === 'admin');
  const personnel = allUsers.filter(u => u.position !== 'Driver' && u.role !== 'manager' && u.role !== 'admin');

  // Get project ID from URL if present
  useEffect(() => {
    const projectId = router.query.projectId as string;
    if (projectId) {
      setFormData(prev => ({ ...prev, project_id: projectId }));
    }
  }, [router.query.projectId]);

  // Only allow managers, supervisors, or admins
  const allowedRoles = ['manager', 'supervisor', 'admin'];

  // Prevent driver double-booking
  const isDriverBooked = (driverId: string, start: string, end: string) => {
    if (!driverId || !start || !end) return false;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return jobs.some(job => {
      if (job.driver_id !== driverId) return false;
      const js = new Date(job.time_start).getTime();
      const je = new Date(job.time_end).getTime();
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

  const handleSelectChange = (e: SelectChangeEvent<string | string[]>) => {
    const { name, value } = e.target;
    if (name === 'personnel_ids') {
      setFormData(prev => ({ ...prev, [name]: value as string[] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value as string }));
    }
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

    // Prevent driver double-booking only if a driver is selected
    if (formData.driver_id && isDriverBooked(formData.driver_id, formData.time_start, formData.time_end)) {
      setSnackbar({
        open: true,
        message: 'Driver is already booked for this time slot.',
        severity: 'error'
      });
      return;
    }

    try {
      const newJob: Omit<Job, 'id' | 'status' | 'acknowledged_at' | 'created_at' | 'updated_at'> = {
        ...formData,
        description: formData.nature_of_work || '', // fallback if nature_of_work is missing
      };

      const job = await assignJob(newJob);
      
      showNotification({
        message: `Job assigned successfully: ${formData.title}`,
        type: 'success',
        link: `/jobs/${job.id}`,
        metadata: { jobId: job.id, type: 'job_assigned' }
      });

      setFormData(initialFormData);
      setSnackbar({
        open: true,
        message: 'Job assigned successfully',
        severity: 'success'
      });

      // If we came from a project page, go back there
      if (router.query.projectId) {
        router.push('/projects');
      }
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
            {/* Project Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Project (Optional)</InputLabel>
                <Select
                  name="project_id"
                  value={formData.project_id || ''}
                  onChange={handleSelectChange}
                  label="Project (Optional)"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {projects.map(project => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

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
                name="nature_of_work"
                value={formData.nature_of_work}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Order Number"
                name="job_order_number"
                value={formData.job_order_number}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Site Address"
                name="site_address"
                value={formData.site_address}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Time"
                name="time_start"
                type="datetime-local"
                value={formData.time_start}
                onChange={handleInputChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Time"
                name="time_end"
                type="datetime-local"
                value={formData.time_end}
                onChange={handleInputChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Supervisor</InputLabel>
                <Select
                  name="supervisor_id"
                  value={formData.supervisor_id}
                  onChange={handleSelectChange}
                  label="Supervisor"
                  required
                >
                  {managers.map(manager => (
                    <MenuItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Personnel</InputLabel>
                <Select
                  multiple
                  name="personnel_ids"
                  value={formData.personnel_ids}
                  onChange={handleSelectChange}
                  label="Personnel"
                  required
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const person = personnel.find(p => p.id === value);
                        return <Chip key={value} label={person?.name || value} />;
                      })}
                    </Box>
                  )}
                >
                  {personnel.map((person) => (
                    <MenuItem key={person.id} value={person.id}>
                      <Checkbox checked={formData.personnel_ids.includes(person.id)} />
                      <ListItemText primary={person.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Driver (Optional)</InputLabel>
                <Select
                  name="driver_id"
                  value={formData.driver_id || ''}
                  onChange={handleSelectChange}
                  label="Driver (Optional)"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {drivers.map(driver => (
                    <MenuItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
            >
              Assign Job
            </Button>
          </Box>
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
