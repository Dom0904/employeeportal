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
  Chip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth, UserRole, User } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';
import { useProject } from '../contexts/ProjectContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useRouter } from 'next/router';
import type { Job } from '../types/Job';

interface FormData {
  project_id: string | null;
  title: string;
  description: string;
  natureOfWork: string;
  jobOrderNumber: string;
  siteAddress: string;
  timeStart: string;
  timeEnd: string;
  supervisorId: string | null;
  driver_id: string | null;
  personnelIds: string[];
  acknowledged_at?: string | null;
}

const initialFormData: FormData = {
  project_id: null,
  title: '',
  description: '',
  natureOfWork: '',
  jobOrderNumber: '',
  siteAddress: '',
  timeStart: '',
  timeEnd: '',
  supervisorId: null,
  driver_id: null,
  personnelIds: [],
  acknowledged_at: null,
};

const JobAssignments: React.FC = () => {
  const { user, getAllUsers } = useAuth();
  const { assignJob, jobs } = useJobs();
  const { projects } = useProject();
  const { showNotification } = useNotifications();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = await getAllUsers();
      setAllUsers(fetchedUsers);
    };
    fetchUsers();
  }, [getAllUsers]);

  useEffect(() => {
    const allowedRolesForPersonnel = [UserRole.ADMIN, UserRole.MANAGER, UserRole.MODERATOR, UserRole.REGULAR];
    const drivers = allUsers.filter(u => u.position === 'Driver');
    const nonDrivers = allUsers.filter(u => u.position !== 'Driver' && allowedRolesForPersonnel.includes(u.role));
    setFilteredUsers([...nonDrivers, ...drivers]);
  }, [allUsers]);

  useEffect(() => {
    const projectId = router.query.projectId as string;
    if (projectId) {
      setFormData(prev => ({ ...prev, project_id: projectId }));
    }
  }, [router.query.projectId]);

  const allowedRolesForPage = [UserRole.MANAGER, UserRole.MODERATOR, UserRole.ADMIN];

  const isDriverBooked = (driverId: string, start: string, end: string) => {
    if (!driverId || !start || !end) return false;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return jobs.some(job => {
      if (job.driver_id !== driverId) return false;
      const js = new Date(job.timeStart || 0).getTime();
      const je = new Date(job.timeEnd || 0).getTime();
      return (s < je && e > js);
    });
  };

  if (!user) {
    return <Typography>Please log in to assign jobs.</Typography>;
  }
  if (!allowedRolesForPage.includes(user.role)) {
    return <Typography>Only managers, supervisors, or admins can assign jobs.</Typography>;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePersonnelChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      personnelIds: value as string[]
    }));
  };

  const handleSelectChange = (event: SelectChangeEvent<string | null>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value,
    }));
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

    if (formData.timeStart && formData.timeEnd) {
      const start = new Date(formData.timeStart);
      const end = new Date(formData.timeEnd);
      if (start.getTime() >= end.getTime()) {
        showNotification({ type: 'error', message: 'End time must be after start time.' });
        return;
      }
    }

    if (formData.driver_id && isDriverBooked(formData.driver_id, formData.timeStart, formData.timeEnd)) {
      setSnackbar({
        open: true,
        message: 'Driver is already booked for another job during this time.',
        severity: 'error'
      });
      return;
    }

    try {
      const newJob: Omit<Job, 'id' | 'status' | 'acknowledged_at' | 'created_at' | 'updated_at'> = {
        project_id: formData.project_id,
        title: formData.title,
        description: formData.description,
        natureOfWork: formData.natureOfWork,
        jobOrderNumber: formData.jobOrderNumber,
        siteAddress: formData.siteAddress,
        timeStart: formData.timeStart,
        timeEnd: formData.timeEnd,
        supervisorId: formData.supervisorId === null ? '' : formData.supervisorId,
        driver_id: formData.driver_id,
        personnelIds: formData.personnelIds,
      };

      const job = await assignJob(newJob);
      
      showNotification({
        message: `Job assigned successfully: ${formData.title}`,
        type: 'success',
        link: `/jobs/${job.id}`,
      });
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error assigning job:', error);
      showNotification({ type: 'error', message: 'Failed to assign job.' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Assign New Job</Typography>
      <Paper elevation={3} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
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
                label="Job Description"
                name="description"
                value={formData.description}
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
                label="Start Time"
                name="timeStart"
                type="datetime-local"
                value={formData.timeStart}
                onChange={handleInputChange}
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Time"
                name="timeEnd"
                type="datetime-local"
                value={formData.timeEnd}
                onChange={handleInputChange}
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Supervisor (Optional)</InputLabel>
                <Select
                  name="supervisorId"
                  value={formData.supervisorId || ''}
                  onChange={handleSelectChange}
                  label="Supervisor (Optional)"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {filteredUsers.filter(u => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN || u.role === UserRole.MODERATOR).map(supervisor => (
                    <MenuItem key={supervisor.id} value={supervisor.id}>
                      {supervisor.name}
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
                  {filteredUsers.filter(u => u.position === 'Driver').map(driver => (
                    <MenuItem key={driver.id} value={driver.id}>
                      {driver.name}
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
                  name="personnelIds"
                  value={formData.personnelIds}
                  onChange={handlePersonnelChange}
                  label="Personnel"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const person = filteredUsers.find(p => p.id === value);
                        return <Chip key={value} label={person?.name || value} />;
                      })}
                    </Box>
                  )}
                >
                  {filteredUsers.filter(u => u.position !== 'Driver' && (u.role === UserRole.REGULAR || u.role === UserRole.MODERATOR)).map((person) => (
                    <MenuItem key={person.id} value={person.id}>
                      <Checkbox checked={formData.personnelIds.includes(person.id)} />
                      {person.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            sx={{ mt: 3 }}
          >
            Assign Job
          </Button>
        </form>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default JobAssignments; 