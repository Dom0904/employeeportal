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
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon
} from '@mui/icons-material';

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
}

const EmployeeStatus = () => {
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      idNumber: '1001',
      name: 'John Doe',
      jobPosition: 'Senior Engineer',
      department: 'Engineering',
      status: 'active',
      lastActive: new Date().toISOString()
    },
    {
      id: '2',
      idNumber: '1002',
      name: 'Jane Smith',
      jobPosition: 'Project Manager',
      department: 'Management',
      status: 'active',
      lastActive: new Date().toISOString()
    },
    {
      id: '3',
      idNumber: '1003',
      name: 'Bob Johnson',
      jobPosition: 'Technician',
      department: 'Operations',
      status: 'off duty',
      lastActive: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      id: '4',
      idNumber: '1004',
      name: 'Alice Williams',
      jobPosition: 'HR Specialist',
      department: 'Human Resources',
      status: 'on leave',
      lastActive: new Date(Date.now() - 7 * 86400000).toISOString() // 7 days ago
    },
    {
      id: '5',
      idNumber: '1005',
      name: 'Charlie Brown',
      jobPosition: 'Sales Representative',
      department: 'Sales',
      status: 'active',
      lastActive: new Date().toISOString()
    }
  ]);
  
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>(employees);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const departments = [...new Set(employees.map(emp => emp.department))];

  // Apply filters when any filter changes
  useEffect(() => {
    let result = [...employees];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(emp => emp.status === statusFilter);
    }
    
    // Apply department filter
    if (departmentFilter !== 'all') {
      result = result.filter(emp => emp.department === departmentFilter);
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(emp => 
        emp.name.toLowerCase().includes(query) || 
        emp.idNumber.toLowerCase().includes(query) ||
        emp.jobPosition.toLowerCase().includes(query)
      );
    }
    
    setFilteredEmployees(result);
  }, [employees, statusFilter, departmentFilter, searchQuery]);

  // Update employee status
  const updateEmployeeStatus = (employeeId: string, newStatus: EmployeeStatus) => {
    // In a real app, this would update the status in Supabase
    setEmployees(prev => 
      prev.map(emp => 
        emp.id === employeeId 
          ? { ...emp, status: newStatus, lastActive: newStatus === 'active' ? new Date().toISOString() : emp.lastActive } 
          : emp
      )
    );
  };

  // Format last active time
  const formatLastActive = (lastActive?: string) => {
    if (!lastActive) return 'Never';
    
    const date = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffDays} days ago`;
    }
  };

  // Get status chip color
  const getStatusColor = (status: EmployeeStatus) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'off duty':
        return 'default';
      case 'on leave':
        return 'warning';
      default:
        return 'default';
    }
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
              </TableRow>
            ))}
            {filteredEmployees.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No employees found matching the current filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Note: Employee status is automatically updated based on time tracking. 
        Admins can manually change an employee's status to "On Leave".
      </Typography>
    </Box>
  );
};

export default EmployeeStatus; 