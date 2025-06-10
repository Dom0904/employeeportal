import React, { useState } from 'react';
import { Box, Typography, Button, TextField, Paper, Grid, Chip, Divider, Stack } from '@mui/material';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useLeave } from '../contexts/LeaveContext';
import { /* LeaveRequest, LeaveStatus */ } from '../types/Leave';
import { format } from 'date-fns';

const LeaveRequests = () => {
  const { user } = useAuth();
  const { leaveRequests, requestLeave, approveLeave, rejectLeave } = useLeave();
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return <Typography color="error">User not found. Please log in.</Typography>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    requestLeave({
      userId: user.id,
      userName: user.name || user.id,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason,
    });
    setForm({ startDate: '', endDate: '', reason: '' });
    setSubmitting(false);
  };

  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR;

  // Filtered leave requests for regular users
  const myRequests = leaveRequests.filter(lr => lr.userId === user.id);

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Request Leave</Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Start Date" name="startDate" type="date" value={form.startDate} onChange={handleChange} InputLabelProps={{ shrink: true }} required />
            <TextField label="End Date" name="endDate" type="date" value={form.endDate} onChange={handleChange} InputLabelProps={{ shrink: true }} required />
            <TextField label="Reason" name="reason" value={form.reason} onChange={handleChange} required multiline minRows={2} />
            <Button type="submit" variant="contained" disabled={submitting}>Submit</Button>
          </Box>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>My Leave Requests</Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            {myRequests.length === 0 && <Typography>No leave requests found.</Typography>}
            {myRequests.map(lr => (
              <Box key={lr.id}>
                <Typography><b>{format(new Date(lr.startDate), 'yyyy-MM-dd')}</b> to <b>{format(new Date(lr.endDate), 'yyyy-MM-dd')}</b></Typography>
                <Typography color="text.secondary">Reason: {lr.reason}</Typography>
                <Chip label={lr.status.toUpperCase()} color={lr.status === 'approved' ? 'success' : lr.status === 'rejected' ? 'error' : 'warning'} sx={{ mt: 1 }} />
              </Box>
            ))}
          </Stack>
        </Paper>
      </Grid>
      {isAdmin && (
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>All Leave Requests</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              {leaveRequests.length === 0 && <Typography>No leave requests found.</Typography>}
              {leaveRequests.map(lr => (
                <Box key={lr.id} sx={{ border: '1px solid #eee', borderRadius: 2, p: 2 }}>
                  <Typography><b>{lr.userName || lr.userId}</b> | <b>{format(new Date(lr.startDate), 'yyyy-MM-dd')}</b> to <b>{format(new Date(lr.endDate), 'yyyy-MM-dd')}</b></Typography>
                  <Typography color="text.secondary">Reason: {lr.reason}</Typography>
                  <Chip label={lr.status.toUpperCase()} color={lr.status === 'approved' ? 'success' : lr.status === 'rejected' ? 'error' : 'warning'} sx={{ mt: 1, mr: 1 }} />
                  {lr.status === 'pending' && (
                    <>
                      <Button size="small" color="success" onClick={() => approveLeave(lr.id, user.id)} sx={{ ml: 1 }}>Accept</Button>
                      <Button size="small" color="error" onClick={() => rejectLeave(lr.id, user.id)} sx={{ ml: 1 }}>Reject</Button>
                    </>
                  )}
                  {lr.reviewedBy && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>Reviewed by: {lr.reviewedBy} {lr.reviewedAt && `(at ${format(new Date(lr.reviewedAt), 'yyyy-MM-dd HH:mm')})`}</Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};

export default LeaveRequests;
