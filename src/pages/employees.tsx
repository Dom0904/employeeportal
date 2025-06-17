import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { UserRole } from '../contexts/AuthContext';
import { SelectChangeEvent } from '@mui/material/Select';
import { supabase } from '../supabaseClient';
import { User } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

interface Employee extends User {
  jobPosition?: string;
  department?: string;
  status?: string;
  dateHired?: string | null;
}

// Define a type for the data coming directly from the 'profiles' table
interface ProfileData {
  id: string;
  id_number: string;
  name: string;
  email: string;
  phone_number?: string;
  position?: string;
  role?: UserRole; // Assuming role is also stored in profiles or derived
  profile_picture?: string;
  department?: string;
  status?: string;
  date_hired?: string | null;
}

const EmployeeList = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '',
    id_number: '',
    email: '',
    phoneNumber: '',
    role: UserRole.REGULAR,
    position: ''
  });
  const [editForm, setEditForm] = useState<Partial<Employee>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('');

  // Check if user has admin role
  useEffect(() => {
    if (!user || user.role !== UserRole.ADMIN) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (error) throw error;

      const employeeData: Employee[] = data.map((profile: ProfileData) => ({
        id: profile.id,
        id_number: profile.id_number,
        name: profile.name,
        email: profile.email,
        phoneNumber: profile.phone_number || '',
        position: profile.position || '',
        role: profile.role || UserRole.REGULAR,
        profilePicture: profile.profile_picture || undefined,
        jobPosition: profile.position || '',
        department: profile.department || '',
        status: profile.status || 'active',
        dateHired: profile.date_hired || null
      }));

      setEmployees(employeeData);
    } catch (error) {
      console.error('Error fetching employees:', error);
      showSnackbar('Failed to load employees', 'error');
    }
  };

  const handleAddEmployee = async () => {
    try {
      // Validate all required fields
      if (!newEmployee.name?.trim()) {
        showSnackbar('Please enter employee name', 'error');
        return;
      }
      if (!newEmployee.id_number?.trim()) {
        showSnackbar('Please enter ID number', 'error');
        return;
      }
      if (!newEmployee.role) {
        showSnackbar('Please select a role', 'error');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!newEmployee.email?.trim() || !emailRegex.test(newEmployee.email)) {
        showSnackbar('Please enter a valid email address', 'error');
        return;
      }

      const requestData = {
        email: newEmployee.email.trim(),
        name: newEmployee.name.trim(),
        role: newEmployee.role,
        phoneNumber: newEmployee.phoneNumber?.trim() || '',
        position: newEmployee.position?.trim() || '',
        id_number: newEmployee.id_number.trim(),
      };

      console.log('Attempting to add employee via API route...');
      console.log('Client-side: Data being sent to API:', requestData);

      const response = await fetch('/api/create-employee-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create employee');
      }

      // Show success message with initial password
      showSnackbar(
        `Employee added successfully! Initial password: ${data.initialPassword}`,
        'success'
      );
      
      handleAddDialogClose();
      fetchEmployees();
    } catch (error: any) {
      console.error('Error adding employee:', error);
      showSnackbar(error.message || 'Failed to add employee', 'error');
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    if (!user) {
      showSnackbar('Error: No authenticated user found.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/delete-employee', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          adminEmail: user.email,
          adminPassword: passwordConfirmation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete employee');
      }

      showSnackbar('Employee deleted successfully', 'success');
      handleDeleteDialogClose();
      fetchEmployees();
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      showSnackbar(error.message || 'Failed to delete employee', 'error');
    } finally {
      setPasswordConfirmation(''); // Clear password field after attempt
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<UserRole>
  ) => {
    const { name, value } = e.target;
    setNewEmployee((prev: Partial<Employee>) => ({
      ...prev,
      [name as string]: value
    }));
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleAddDialogOpen = () => setOpenAddDialog(true);
  const handleAddDialogClose = () => {
    setOpenAddDialog(false);
    setNewEmployee({
      name: '',
      id_number: '',
      email: '',
      phoneNumber: '',
      role: UserRole.REGULAR,
      position: ''
    });
  };

  const handleDeleteDialogOpen = (employee: Employee) => {
    setSelectedEmployee(employee);
    setOpenDeleteDialog(true);
  };

  const handleDeleteDialogClose = () => {
    setOpenDeleteDialog(false);
    setSelectedEmployee(null);
  };

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditForm({
      name: employee.name,
      position: employee.position,
      department: employee.department,
      email: employee.email,
      phoneNumber: employee.phoneNumber
    });
    setOpenEditDialog(true);
  };

  const handleEditSave = async () => {
    if (!selectedEmployee) return;

    try {
      const response = await fetch('/api/update-employee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedEmployee.id,
          updates: {
            name: editForm.name,
            position: editForm.position,
            department: editForm.department,
            email: editForm.email,
            phone_number: editForm.phoneNumber
          }
        })
      });

      if (!response.ok) throw new Error('Failed to update employee');

      showSnackbar('Employee updated successfully', 'success');
      setOpenEditDialog(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      showSnackbar('Failed to update employee', 'error');
    }
  };

  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Employee List</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddDialogOpen}
        >
          Add Employee
        </Button>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white' }}>ID Number</TableCell>
              <TableCell sx={{ color: 'white' }}>Name</TableCell>
              <TableCell sx={{ color: 'white' }}>Job Position</TableCell>
              <TableCell sx={{ color: 'white' }}>Email</TableCell>
              <TableCell sx={{ color: 'white' }}>Phone</TableCell>
              <TableCell sx={{ color: 'white' }}>Role</TableCell>
              <TableCell sx={{ color: 'white' }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee: Employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.id_number}</TableCell>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.phoneNumber}</TableCell>
                <TableCell>{employee.role}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit">
                    <IconButton
                      onClick={() => handleEditClick(employee)}
                      size="small"
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      onClick={() => handleDeleteDialogOpen(employee)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No employees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Employee Dialog */}
      <Dialog open={openAddDialog} onClose={handleAddDialogClose}>
        <DialogTitle>Add New Employee</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please fill in the employee details. ID Number will be used as the initial password.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Full Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newEmployee.name}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="id_number"
            label="ID Number"
            type="text"
            fullWidth
            variant="outlined"
            value={newEmployee.id_number}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="position"
            label="Job Position"
            type="text"
            fullWidth
            variant="outlined"
            value={newEmployee.position}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={newEmployee.email}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="phoneNumber"
            label="Phone Number"
            type="tel"
            fullWidth
            variant="outlined"
            value={newEmployee.phoneNumber}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="role-select-label">Role</InputLabel>
            <Select
              labelId="role-select-label"
              name="role"
              value={newEmployee.role}
              onChange={handleInputChange}
              label="Role"
            >
              <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
              <MenuItem value={UserRole.MODERATOR}>Moderator</MenuItem>
              <MenuItem value={UserRole.MANAGER}>Manager</MenuItem>
              <MenuItem value={UserRole.REGULAR}>Regular</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddDialogClose}>Cancel</Button>
          <Button onClick={handleAddEmployee} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteDialogClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {selectedEmployee?.name} from the employee list?
            This action cannot be undone. Please confirm by entering your password.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="passwordConfirmation"
            label="Your Password"
            type="password"
            fullWidth
            variant="outlined"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteEmployee} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Employee Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Name"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Position"
              value={editForm.position || ''}
              onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
              fullWidth
            />
            <TextField
              label="Department"
              value={editForm.department || ''}
              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone Number"
              value={editForm.phoneNumber || ''}
              onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeList; 