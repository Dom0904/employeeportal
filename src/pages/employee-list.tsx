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
  IconButton,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { UserRole } from '../contexts/AuthContext';
import { SelectChangeEvent } from '@mui/material/Select';

// Mock database for now - in a real app, this would use Supabase
interface Employee {
  id: string;
  idNumber: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  password: string;
  jobPosition: string;
  profilePicture?: string;
}

const EmployeeList = () => {
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      idNumber: '1001',
      name: 'John Doe',
      email: 'john@edgetech.com',
      phoneNumber: '123-456-7890',
      role: UserRole.ADMIN,
      password: 'password',
      jobPosition: 'Senior Engineer'
    },
    {
      id: '2',
      idNumber: '1002',
      name: 'Jane Smith',
      email: 'jane@edgetech.com',
      phoneNumber: '123-456-7891',
      role: UserRole.MANAGER,
      password: 'password',
      jobPosition: 'Project Manager'
    },
    {
      id: '3',
      idNumber: '1003',
      name: 'Bob Johnson',
      email: 'bob@edgetech.com',
      phoneNumber: '123-456-7892',
      role: UserRole.REGULAR,
      password: 'password',
      jobPosition: 'Technician'
    }
  ]);
  
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '',
    idNumber: '',
    email: '',
    phoneNumber: '',
    role: UserRole.REGULAR,
    password: '',
    jobPosition: ''
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // In a real app, this would fetch data from Supabase
  useEffect(() => {
    // Fetch employees from Supabase
    // const fetchEmployees = async () => {
    //   try {
    //     const { data, error } = await supabase
    //       .from('employees')
    //       .select('*');
    //
    //     if (error) throw error;
    //     if (data) setEmployees(data);
    //   } catch (error) {
    //     console.error('Error fetching employees:', error);
    //     setSnackbarMessage('Failed to load employees');
    //     setSnackbarSeverity('error');
    //     setSnackbarOpen(true);
    //   }
    // };
    //
    // fetchEmployees();
  }, []);

  const handleAddDialogOpen = () => {
    setOpenAddDialog(true);
  };

  const handleAddDialogClose = () => {
    setOpenAddDialog(false);
    setNewEmployee({
      name: '',
      idNumber: '',
      email: '',
      phoneNumber: '',
      role: UserRole.REGULAR,
      password: '',
      jobPosition: ''
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<UserRole>) => {
    const { name, value } = e.target;
    setNewEmployee({
      ...newEmployee,
      [name]: value,
    });
  };

  const handleAddEmployee = async () => {
    try {
      // Validate required fields
      if (!newEmployee.name || !newEmployee.idNumber || !newEmployee.password) {
        setSnackbarMessage('Name, ID Number, and Password are required');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // In a real app, this would add to Supabase
      // const { data, error } = await supabase
      //   .from('employees')
      //   .insert([newEmployee]);
      //
      // if (error) throw error;

      // For now, just add to our local state
      const newEmployeeWithId = {
        ...newEmployee,
        id: Date.now().toString() // Generate a temporary ID
      } as Employee;
      
      setEmployees(prev => [...prev, newEmployeeWithId]);
      handleAddDialogClose();
      
      setSnackbarMessage('Employee added successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error adding employee:', error);
      setSnackbarMessage('Failed to add employee');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    
    try {
      // In a real app, this would delete from Supabase
      // const { error } = await supabase
      //   .from('employees')
      //   .delete()
      //   .eq('id', selectedEmployee.id);
      //
      // if (error) throw error;

      // For now, just remove from our local state
      setEmployees(prev => prev.filter(emp => emp.id !== selectedEmployee.id));
      handleDeleteDialogClose();
      
      setSnackbarMessage('Employee removed successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting employee:', error);
      setSnackbarMessage('Failed to remove employee');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

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
              <TableRow key={employee.id} hover>
                <TableCell>{employee.idNumber}</TableCell>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.jobPosition}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.phoneNumber}</TableCell>
                <TableCell>{employee.role}</TableCell>
                <TableCell align="center">
                  <IconButton color="error" onClick={() => handleDeleteDialogOpen(employee)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Employee Dialog */}
      <Dialog open={openAddDialog} onClose={handleAddDialogClose}>
        <DialogTitle>Add New Employee</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please fill in the employee details. ID Number and Password will be used for login.
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
            name="idNumber"
            label="ID Number"
            type="text"
            fullWidth
            variant="outlined"
            value={newEmployee.idNumber}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="password"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={newEmployee.password}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="jobPosition"
            label="Job Position"
            type="text"
            fullWidth
            variant="outlined"
            value={newEmployee.jobPosition}
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
          <FormControl fullWidth variant="outlined">
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
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeList; 