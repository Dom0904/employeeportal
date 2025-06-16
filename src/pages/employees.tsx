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
}

const EmployeeList = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '',
    id_number: '',
    email: '',
    phoneNumber: '',
    role: UserRole.REGULAR,
    position: ''
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

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
        .from('employee_list')
        .select('*')
        .order('name');

      if (error) throw error;

      const employeeData: Employee[] = data.map(profile => ({
        id: profile.id,
        id_number: profile.id_number,
        name: profile.name,
        email: profile.email,
        phoneNumber: profile.phone_number || '',
        position: profile.position || '',
        role: profile.role || 'regular',
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
      console.log('Attempting to add employee via API route...');
      console.log('Client-side: Data being sent to API:', newEmployee);
      const response = await fetch('/api/create-employee-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newEmployee.email,
          password: newEmployee.id_number, // Use id_number as initial password
          name: newEmployee.name,
          role: newEmployee.role,
          phoneNumber: newEmployee.phoneNumber,
          position: newEmployee.position,
          id_number: newEmployee.id_number,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create employee');
      }

      showSnackbar('Employee added successfully', 'success');
      handleAddDialogClose();
      fetchEmployees();
    } catch (error: any) {
      console.error('Error adding employee:', error);
      showSnackbar(error.message || 'Failed to add employee', 'error');
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      // First delete the auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(selectedEmployee.id);
      if (authError) throw authError;

      // The profile will be deleted automatically by the foreign key constraint
      showSnackbar('Employee deleted successfully', 'success');
      handleDeleteDialogClose();
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      showSnackbar('Failed to delete employee', 'error');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<UserRole>
  ) => {
    const { name, value } = e.target;
    setNewEmployee(prev => ({
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
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.id_number}</TableCell>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.phoneNumber}</TableCell>
                <TableCell>{employee.role}</TableCell>
                <TableCell align="center">
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
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteEmployee} color="error" variant="contained">
            Delete
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