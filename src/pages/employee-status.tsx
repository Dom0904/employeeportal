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
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Employee status types
type EmployeeStatus = 'active' | 'off duty' | 'on leave';

// Employee interface
interface Employee {
  id: string;
  idNumber: string;
  name: string;
  jobPosition: string;
  department: string;
  status: EmployeeStatus;
  lastActive?: string;
  clockInTime?: string;
  clockOutTime?: string;
  email?: string;
  phoneNumber?: string;
}

// Status history interface
interface StatusHistory {
  id: string;
  employee_id: string;
  status: EmployeeStatus;
  changed_at: string;
  changed_by: string;
  reason?: string;
}

const EmployeeStatusPage = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [editForm, setEditForm] = useState<Partial<Employee>>({});

  // Fetch employees from profiles table
  useEffect(() => {
    fetchEmployees();
    // Set up real-time subscription
    const subscription = supabase
      .channel('profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchEmployees();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          time_logs (
            clock_in,
            clock_out
          )
        `)
        .order('name');

      if (error) throw error;

      const employeeData: Employee[] = data.map(profile => {
        const latestTimeLog = profile.time_logs?.[0];
        const status = determineStatus(latestTimeLog);
        
        return {
          id: profile.id,
          idNumber: profile.id_number || '',
          name: profile.name,
          jobPosition: profile.position || '',
          department: profile.department || 'General',
          status,
          lastActive: profile.last_active || new Date().toISOString(),
          clockInTime: latestTimeLog?.clock_in,
          clockOutTime: latestTimeLog?.clock_out,
          email: profile.email,
          phoneNumber: profile.phone_number
        };
      });

      setEmployees(employeeData);
      setFilteredEmployees(employeeData);
    } catch (error) {
      console.error('Error fetching employees:', error);
      showSnackbar('Failed to load employees', 'error');
    }
  };

  const determineStatus = (timeLog: any): EmployeeStatus => {
    if (!timeLog) return 'off duty';
    if (timeLog.clock_in && !timeLog.clock_out) return 'active';
    return 'off duty';
  };

  // Update filtered employees when filters change
  useEffect(() => {
    let filtered = employees;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(query) ||
        emp.idNumber.toLowerCase().includes(query) ||
        emp.jobPosition.toLowerCase().includes(query) ||
        emp.department.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(emp => emp.status === statusFilter);
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    setFilteredEmployees(filtered);
  }, [employees, searchQuery, statusFilter, departmentFilter]);

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditForm({
      name: employee.name,
      jobPosition: employee.jobPosition,
      department: employee.department,
      email: employee.email,
      phoneNumber: employee.phoneNumber
    });
    setEditDialogOpen(true);
  };

  const handleHistoryClick = async (employee: Employee) => {
    setSelectedEmployee(employee);
    try {
      const { data, error } = await supabase
        .from('status_history')
        .select('*')
        .eq('employee_id', employee.id)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      setStatusHistory(data || []);
      setHistoryDialogOpen(true);
    } catch (error) {
      console.error('Error fetching status history:', error);
      showSnackbar('Failed to load status history', 'error');
    }
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
            position: editForm.jobPosition,
            department: editForm.department,
            email: editForm.email,
            phone_number: editForm.phoneNumber
          }
        })
      });

      if (!response.ok) throw new Error('Failed to update employee');

      showSnackbar('Employee updated successfully', 'success');
      setEditDialogOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      showSnackbar('Failed to update employee', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const departments = [...new Set(employees.map(emp => emp.department))];

  const getStatusColor = (status: EmployeeStatus) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'off duty':
        return 'warning';
      case 'on leave':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatLastActive = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Employee Status Tracking
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {/* Filters */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 200 }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="off duty">Off Duty</MenuItem>
            <MenuItem value="on leave">On Leave</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="department-filter-label">Department</InputLabel>
          <Select
            labelId="department-filter-label"
            value={departmentFilter}
            label="Department"
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <MenuItem value="all">All Departments</MenuItem>
            {departments.map(dept => (
              <MenuItem key={dept} value={dept}>{dept}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      {/* Employee Status Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white' }}>ID</TableCell>
              <TableCell sx={{ color: 'white' }}>Name</TableCell>
              <TableCell sx={{ color: 'white' }}>Position</TableCell>
              <TableCell sx={{ color: 'white' }}>Department</TableCell>
              <TableCell sx={{ color: 'white' }}>Status</TableCell>
              <TableCell sx={{ color: 'white' }}>Last Active</TableCell>
              <TableCell sx={{ color: 'white' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee.id} hover>
                <TableCell>{employee.idNumber}</TableCell>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.jobPosition}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>
                  <Chip 
                    label={employee.status.charAt(0).toUpperCase() + employee.status.slice(1)} 
                    color={getStatusColor(employee.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatLastActive(employee.lastActive)}</TableCell>
                <TableCell>
                  <Tooltip title="Edit Profile">
                    <IconButton
                      size="small"
                      onClick={() => handleEditClick(employee)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View History">
                    <IconButton
                      size="small"
                      onClick={() => handleHistoryClick(employee)}
                    >
                      <HistoryIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View Time Log">
                    <IconButton
                      size="small"
                      onClick={() => {/* TODO: Implement time log view */}}
                    >
                      <AccessTimeIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {filteredEmployees.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No employees found matching the current filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
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
              value={editForm.jobPosition || ''}
              onChange={(e) => setEditForm({ ...editForm, jobPosition: e.target.value })}
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
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status History Dialog */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Status History</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Changed By</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statusHistory.map((history) => (
                  <TableRow key={history.id}>
                    <TableCell>{new Date(history.changed_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={history.status}
                        color={getStatusColor(history.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{history.changed_by}</TableCell>
                    <TableCell>{history.reason || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeStatusPage; 