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
import { supabase } from '../supabaseClient';

// Time record interface
interface TimeRecord {
  id: string;
  user_id: string;
  user_name: string;
  timein: string;
  timeout: string | null;
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
  const [currentTime, setCurrentTime] = useState<Date>(new Date()); // State for current time
  const [mounted, setMounted] = useState(false); // State to track if component is mounted

  // Update current time every second
  useEffect(() => {
    setMounted(true); // Component is mounted
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
        user_id: user.id,
        user_name: user.name,
        timein: timeIn,
        timeout: timeOut,
        date: dateStr
      });
    }
    
    // Check if there's a record for today
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayRecord = mockRecords.find(record => record.date === todayStr);
    
    // If there's a record for today with no timeout, the user is timed in
    if (todayRecord && !todayRecord.timeout) {
      setIsTimedIn(true);
      setCurrentRecord(todayRecord);
    } else {
      setIsTimedIn(false);
    }
    
    setTimeRecords(mockRecords);
  }, [user]);

  // Handle time in
  const handleTimeIn = async () => {
    if (!user) return;

    const now = new Date();
    const dateStr = format(now, 'yyyy-MM-dd');
    const timeStr = format(now, 'yyyy-MM-dd\'T\'HH:mm:ss');

    const newRecord = {
      user_id: user.id,
      user_name: user.name,
      timein: timeStr,
      timeout: null,
      date: dateStr
    };

    // Save to Supabase
    const { data, error } = await supabase
      .from('time_records')
      .insert([newRecord])
      .select(); // Select the inserted data to get the correct id and other fields

    if (error) {
      console.error('Error saving time in record:', error);
      setSnackbarMessage('Failed to record time in');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Use the data returned from Supabase
    const savedRecord = data?.[0];
    if(savedRecord) {
      // Supabase generates the id, so we use the one returned from the insert operation
      const clientSideRecord: TimeRecord = {
         id: savedRecord.id,
         user_id: savedRecord.user_id,
         user_name: savedRecord.user_name,
         timein: savedRecord.timein,
         timeout: savedRecord.timeout,
         date: savedRecord.date
      };
      setTimeRecords(prev => [clientSideRecord, ...prev]);
      setCurrentRecord(clientSideRecord);
      setIsTimedIn(true);

      setSnackbarMessage('Time in recorded successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } else {
       setSnackbarMessage('Failed to retrieve saved time in record');
       setSnackbarSeverity('error');
       setSnackbarOpen(true);
    }
  };

  // Handle time out
  const handleTimeOut = async () => {
    if (!currentRecord) return;

    const now = new Date();
    const timeStr = format(now, 'yyyy-MM-dd\'T\'HH:mm:ss');

    // Update in Supabase
    const { data, error } = await supabase
      .from('time_records')
      .update({ timeout: timeStr })
      .eq('id', currentRecord.id)
      .select(); // Select the updated data

    if (error) {
      console.error('Error saving time out record:', error);
      setSnackbarMessage('Failed to record time out');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Use the data returned from Supabase
     const updatedSavedRecord = data?.[0];
     if(updatedSavedRecord) {
       const clientSideUpdatedRecord: TimeRecord = {
         id: updatedSavedRecord.id,
         user_id: updatedSavedRecord.user_id,
         user_name: updatedSavedRecord.user_name,
         timein: updatedSavedRecord.timein,
         timeout: updatedSavedRecord.timeout,
         date: updatedSavedRecord.date
       };
      setTimeRecords(prev =>
        prev.map(record =>
          record.id === currentRecord.id ? clientSideUpdatedRecord : record
        )
      );
      setCurrentRecord(null);
      setIsTimedIn(false);

      setSnackbarMessage('Time out recorded successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } else {
       setSnackbarMessage('Failed to retrieve updated time out record');
       setSnackbarSeverity('error');
       setSnackbarOpen(true);
    }
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
  const calculateDuration = (timein: string, timeout: string | null) => {
    if (!timeout) return '--:--';
    
    try {
      const start = parseISO(timein);
      const end = parseISO(timeout);
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
                {mounted ? format(currentTime, 'EEEE, MMMM d, yyyy') : ''}
              </Typography>
              <Typography variant="h3" sx={{ fontFamily: 'monospace', mb: 3 }}>
                {mounted ? format(currentTime, 'hh:mm:ss a') : ''}
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
                    {currentRecord ? formatTime(currentRecord.timein) : '--:--'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Time Out:</Typography>
                  <Typography variant="body1">
                    {currentRecord && currentRecord.timeout ? formatTime(currentRecord.timeout) : '--:--'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Duration:</Typography>
                  <Typography variant="body1">
                    {currentRecord ? calculateDuration(currentRecord.timein, currentRecord.timeout) : '--:--'}
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
                <TableCell>{formatTime(record.timein)}</TableCell>
                <TableCell>{formatTime(record.timeout)}</TableCell>
                <TableCell>{calculateDuration(record.timein, record.timeout)}</TableCell>
                <TableCell>
                  {record.timeout ? 'Completed' : 'Active'}
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