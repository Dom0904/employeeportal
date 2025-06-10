import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Stack
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  EventNote as EventNoteIcon,
  Announcement as AnnouncementIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useJobs } from '../contexts/JobContext';
import { format, isToday } from 'date-fns';
import { useLeave } from '../contexts/LeaveContext';
import { supabase } from '../supabaseClient';

const Dashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { jobs } = useJobs();
  const { leaveRequests } = useLeave();
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching announcements:', error);
        return;
      }
      setAnnouncements(data || []);
    };
    fetchAnnouncements();
  }, []);
  
  // Mock data for dashboard
  const upcomingTasks = [
    { id: 1, title: "Complete Project Report", deadline: "2023-06-07" },
    { id: 2, title: "Team Meeting", deadline: "2023-06-06" },
    { id: 3, title: "Client Presentation", deadline: "2023-06-10" }
  ];
  
  // Filter jobs for today's schedule
  const todaySchedule = jobs.filter(job => isToday(new Date(job.timeStart)))
    .map(job => ({
      id: job.id,
      time: format(new Date(job.timeStart), 'hh:mm a'), // Format time as needed
      title: job.title,
    }));

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Welcome Header */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          borderTop: '4px solid',
          borderColor: 'secondary.main'
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom color="primary.main">
            Welcome, {user?.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Role: {user?.position} | ID: {user?.id}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ mt: { xs: 2, md: 0 } }}>
          <Button 
            variant="contained" 
            onClick={() => router.push('/time-tracking')}
            color="secondary"
          >
            Clock In/Out
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => router.push('/leave-requests')}
            color="primary"
          >
            Request Leave
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {/* Announcements */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            borderTop: '3px solid',
            borderColor: 'primary.main'
          }}>
            <CardHeader 
              title="Announcements" 
              avatar={<AnnouncementIcon color="primary" />}
              action={
                <Button size="small" onClick={() => router.push('/announcements')} color="primary">
                  View All
                </Button>
              }
              sx={{ backgroundColor: 'rgba(94, 46, 142, 0.05)' }}
            />
            <Divider />
            <CardContent>
              <List>
                {announcements.map((announcement) => (
                  <React.Fragment key={announcement.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={announcement.title}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="primary">
                              {format(new Date(announcement.created_at), 'yyyy-MM-dd')}
                            </Typography>
                            {` — ${announcement.content}`}
                          </>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Today's Schedule */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            borderTop: '3px solid',
            borderColor: 'secondary.main'
          }}>
            <CardHeader 
              title="Today's Schedule" 
              avatar={<TodayIcon sx={{ color: 'secondary.main' }} />}
              action={
                <Button size="small" onClick={() => router.push('/calendar')} color="primary">
                  Calendar
                </Button>
              }
              sx={{ backgroundColor: 'rgba(164, 255, 0, 0.1)' }}
            />
            <Divider />
            <CardContent>
              <List>
                {todaySchedule.map((item) => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemText
                        primary={item.title}
                        secondary={item.time}
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Tasks */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            borderTop: '3px solid',
            borderColor: 'secondary.main'
          }}>
            <CardHeader 
              title="Upcoming Tasks" 
              avatar={<AssignmentIcon sx={{ color: 'secondary.main' }} />}
              action={
                <Button size="small" onClick={() => router.push('/job-assignments')} color="primary">
                  View All
                </Button>
              }
              sx={{ backgroundColor: 'rgba(164, 255, 0, 0.1)' }}
            />
            <Divider />
            <CardContent>
              <List>
                {upcomingTasks.map((task) => (
                  <React.Fragment key={task.id}>
                    <ListItem>
                      <ListItemText
                        primary={task.title}
                        secondary={`Deadline: ${task.deadline}`}
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Leave Requests */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            borderTop: '3px solid',
            borderColor: 'primary.main'
          }}>
            <CardHeader 
              title="My Leave Requests" 
              avatar={<EventNoteIcon color="primary" />}
              action={
                <Button size="small" onClick={() => router.push('/leave-requests')} color="primary">
                  New Request
                </Button>
              }
              sx={{ backgroundColor: 'rgba(94, 46, 142, 0.05)' }}
            />
            <Divider />
            <CardContent>
              <List>
                {/* Use fetched leave requests */}
                {leaveRequests.map((request, index) => (
                  <React.Fragment key={request.id}>
                    <ListItem>
                      <ListItemText
                        primary={request.reason} // Use 'reason' from Supabase data
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="primary">
                              {request.status}
                            </Typography>
                            {/* Use startDate and endDate from LeaveRequest type */}
                            {` — ${format(new Date(request.startDate), 'yyyy-MM-dd')} to ${format(new Date(request.endDate), 'yyyy-MM-dd')}`}
                          </>
                        }
                      />
                    </ListItem>
                    {index < leaveRequests.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 
