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
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import { UserRole } from '../contexts/AuthContext';
import { SelectChangeEvent } from '@mui/material/Select';
import { supabase } from '../supabaseClient'; // Import supabase
import { User } from '../contexts/AuthContext'; // Import User interface

// Mock database for now - in a real app, this would use Supabase
// Removed Mock database comment and interface below

interface Employee extends User { // Extend User interface
  // The User interface already has id, id_number, name, email, phoneNumber, position, profilePicture
  // We can keep jobPosition for display purposes if it's different from position, but align data fetching to 'position'
  jobPosition?: string; // Optional if it maps to 'position'
}

const EmployeeList = () => {
  // Removed mock employees useState
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '',
    id_number: '', // Use id_number
    email: '',
    phoneNumber: '',
    role: UserRole.REGULAR,
    // Removed password from newEmployee state, handle separately or via auth
    position: '' // Use position
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // In a real app, this would fetch data from Supabase
  useEffect(() => {
    // Fetch employees from Supabase (profiles table)
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, id_number, name, email, phone_number, position, role, profile_picture'); // Select necessary fields

        if (error) throw error;
        // Map fetched data to Employee interface (which extends User)
        const employeeData: Employee[] = data.map(profile => ({
          id: profile.id,
          id_number: profile.id_number,
          name: profile.name,
          email: profile.email,
          phoneNumber: profile.phone_number || '', // Handle potential nulls
          position: profile.position || '', // Handle potential nulls
          role: profile.role as UserRole, // Cast role
          profilePicture: profile.profile_picture || undefined,
          jobPosition: profile.position || '', // Map position to jobPosition for display if needed
        }));
        setEmployees(employeeData);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setSnackbarMessage('Failed to load employees');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };

    fetchEmployees();
  }, []); // Empty dependency array to fetch only on mount

  const handleAddDialogOpen = () => {
    setOpenAddDialog(true);
  };

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
  };

  const handleDeleteDialogClose = () => {
    setOpenDeleteDialog(false);
    setSelectedEmployee(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<UserRole>) => {
    const { name, value } = e.target;
    // Cast name to keyof Partial<Employee> to allow updating Partial state
    setNewEmployee({
      ...newEmployee,
      [name as keyof Partial<Employee>]: value,
    });
  };

  const handleAddEmployee = async () => {
    try {
      // Validate required fields
      if (!newEmployee.name || !newEmployee.id_number) { // Validate name and id_number
        setSnackbarMessage('Name and ID Number are required');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // In a real app, creating a new user would involve Supabase Auth signUp
      // and then inserting the profile data. Direct insertion into profiles table
      // with password is not the standard secure approach.
      // For now, we will disable client-side add employee functionality.
      setSnackbarMessage('Adding employees is currently disabled in this demo.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      // Commenting out the actual add logic for now
      // const { data, error } = await supabase
      //   .from('profiles') // Assuming profiles table for employee data
      //   .insert([{ ...newEmployee, id_number: newEmployee.id_number, position: newEmployee.position }]); // Map fields
      // if (error) throw error;
      // // Refresh the list after adding
      // fetchEmployees(); // You might want a more efficient way to update state
      // handleAddDialogClose();
      // setSnackbarMessage('Employee added successfully');
      // setSnackbarSeverity('success');
      // setSnackbarOpen(true);
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
      // In a real app, deleting a user involves Supabase Auth deletion
      // and cascading delete on the profiles table.
      // Direct deletion from profiles might leave orphaned auth users.
      // For now, we will disable client-side delete employee functionality.
       setSnackbarMessage('Deleting employees is currently disabled in this demo.');
       setSnackbarSeverity('success');
       setSnackbarOpen(true);
      // Commenting out the actual delete logic for now
      // const { error } = await supabase
      //   .from('profiles')
      //   .delete()
      //   .eq('id', selectedEmployee.id);
      // if (error) throw error;
      // // Refresh the list after deleting
      // fetchEmployees(); // You might want a more efficient way to update state
      // handleDeleteDialogClose();
      // setSnackbarMessage('Employee removed successfully');
      // setSnackbarSeverity('success');
      // setSnackbarOpen(true);
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
              <TableRow key={employee.id}>
                <TableCell>{employee.id_number}</TableCell> {/* Use id_number */}
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.position}</TableCell> {/* Use position */}
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.phoneNumber}</TableCell> {/* Use phoneNumber */}
                <TableCell>{employee.role}</TableCell>
                <TableCell align="center">
                  {/* Edit functionality would need to be implemented to update Supabase */}
                  {/* Delete button - temporarily commented out */}
                  {/* <Tooltip title="Delete">*/}
                  {/*   <IconButton */}
                  {/*     onClick={() => handleDeleteDialogOpen(employee)} */}
                  {/*     size="small" */}
                  {/*     color="error" */}
                  {/*   > */}
                  {/*     <DeleteIcon /> */}
                  {/*   </IconButton> */}
                  {/* </Tooltip> */}
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