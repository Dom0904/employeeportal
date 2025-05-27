import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Login as LoginIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { format, subDays, parseISO } from 'date-fns';

// Time record interface
interface TimeRecord {
  id: string;
  userId: string;
  userName: string;
  timeIn: string;
  timeOut: string | null;
  date: string;
}

const TimeTracking = () => {
  const { user } = useAuth();
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [isTimedIn, setIsTimedIn] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<TimeRecord | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Generate some mock data for the last 30 days
  useEffect(() => {
    if (!user) return;

    // Generate mock time records for the past 30 days
    const mockRecords: TimeRecord[] = [];
    const today = new Date();
    
    // Generate one record per day for the last 30 days
    for (let i = 29; i >= 0; i--) {
      const recordDate = subDays(today, i);
      const dateStr = format(recordDate, 'yyyy-MM-dd');
      
      // Skip weekends in our mock data
      const dayOfWeek = recordDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      // Don't create a record for today yet
      if (i === 0) continue;
      
      const timeIn = `${dateStr}T08:${Math.floor(Math.random() * 15) + 1}:00`;
      const timeOut = `${dateStr}T17:${Math.floor(Math.random() * 30) + 1}:00`;
      
      mockRecords.push({
        id: `record-${i}`,
        userId: user.id,
        userName: user.name,
        timeIn,
        timeOut,
        date: dateStr
      });
    }
    
    // Check if there's a record for today
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayRecord = mockRecords.find(record => record.date === todayStr);
    
    // If there's a record for today with no timeOut, the user is timed in
    if (todayRecord && !todayRecord.timeOut) {
      setIsTimedIn(true);
      setCurrentRecord(todayRecord);
    } else {
      setIsTimedIn(false);
    }
    
    setTimeRecords(mockRecords);
  }, [user]);

  // Handle time in
  const handleTimeIn = () => {
    if (!user) return;
    
    const now = new Date();
    const dateStr = format(now, 'yyyy-MM-dd');
    const timeStr = format(now, 'yyyy-MM-dd\'T\'HH:mm:ss');
    
    const newRecord: TimeRecord = {
      id: `record-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      timeIn: timeStr,
      timeOut: null,
      date: dateStr
    };
    
    // In a real app, this would be saved to Supabase
    // const { data, error } = await supabase
    //   .from('time_records')
    //   .insert([newRecord]);
    
    setTimeRecords(prev => [newRecord, ...prev]);
    setCurrentRecord(newRecord);
    setIsTimedIn(true);
    
    setSnackbarMessage('Time in recorded successfully');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  // Handle time out
  const handleTimeOut = () => {
    if (!currentRecord) return;
    
    const now = new Date();
    const timeStr = format(now, 'yyyy-MM-dd\'T\'HH:mm:ss');
    
    const updatedRecord = {
      ...currentRecord,
      timeOut: timeStr
    };
    
    // In a real app, this would be updated in Supabase
    // const { data, error } = await supabase
    //   .from('time_records')
    //   .update({ timeOut: timeStr })
    //   .eq('id', currentRecord.id);
    
    setTimeRecords(prev => 
      prev.map(record => 
        record.id === currentRecord.id ? updatedRecord : record
      )
    );
    setCurrentRecord(null);
    setIsTimedIn(false);
    
    setSnackbarMessage('Time out recorded successfully');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Format time for display
  const formatTime = (timeString: string | null) => {
    if (!timeString) return '--:--';
    try {
      return format(parseISO(timeString), 'hh:mm a');
    } catch (error) {
      return '--:--';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Calculate duration between time in and time out
  const calculateDuration = (timeIn: string, timeOut: string | null) => {
    if (!timeOut) return '--:--';
    
    try {
      const start = parseISO(timeIn);
      const end = parseISO(timeOut);
      const diffInMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      
      return `${hours}h ${minutes}m`;
    } catch (error) {
      return '--:--';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Time Tracking
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {/* Time In/Out Controls */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
              <AccessTimeIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </Typography>
              <Typography variant="h3" sx={{ fontFamily: 'monospace', mb: 3 }}>
                {format(new Date(), 'hh:mm:ss a')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<LoginIcon />}
                  onClick={handleTimeIn}
                  disabled={isTimedIn}
                >
                  Time In
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={<LogoutIcon />}
                  onClick={handleTimeOut}
                  disabled={!isTimedIn}
                >
                  Time Out
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Status
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Status:</Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: isTimedIn ? 'success.main' : 'text.secondary' 
                    }}
                  >
                    {isTimedIn ? 'Active' : 'Off Duty'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Time In:</Typography>
                  <Typography variant="body1">
                    {currentRecord ? formatTime(currentRecord.timeIn) : '--:--'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Time Out:</Typography>
                  <Typography variant="body1">
                    {currentRecord && currentRecord.timeOut ? formatTime(currentRecord.timeOut) : '--:--'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Duration:</Typography>
                  <Typography variant="body1">
                    {currentRecord ? calculateDuration(currentRecord.timeIn, currentRecord.timeOut) : '--:--'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Time Records Table */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Last 30 Days Time Records
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white' }}>Date</TableCell>
              <TableCell sx={{ color: 'white' }}>Time In</TableCell>
              <TableCell sx={{ color: 'white' }}>Time Out</TableCell>
              <TableCell sx={{ color: 'white' }}>Duration</TableCell>
              <TableCell sx={{ color: 'white' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timeRecords.map((record) => (
              <TableRow key={record.id} hover>
                <TableCell>{formatDate(record.date)}</TableCell>
                <TableCell>{formatTime(record.timeIn)}</TableCell>
                <TableCell>{formatTime(record.timeOut)}</TableCell>
                <TableCell>{calculateDuration(record.timeIn, record.timeOut)}</TableCell>
                <TableCell>
                  {record.timeOut ? 'Completed' : 'Active'}
                </TableCell>
              </TableRow>
            ))}
            {timeRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No time records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
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

export default TimeTracking; 