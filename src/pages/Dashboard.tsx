import React from 'react';
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
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Mock data for dashboard
  const announcements = [
    { id: 1, title: "Company Picnic", date: "2023-06-15", content: "Annual company picnic this weekend!" },
    { id: 2, title: "New Project Launch", date: "2023-06-10", content: "Project X will be launched next week" },
    { id: 3, title: "IT Maintenance", date: "2023-06-08", content: "Scheduled maintenance on Saturday" }
  ];
  
  const upcomingTasks = [
    { id: 1, title: "Complete Project Report", deadline: "2023-06-07" },
    { id: 2, title: "Team Meeting", deadline: "2023-06-06" },
    { id: 3, title: "Client Presentation", deadline: "2023-06-10" }
  ];
  
  const leaveRequests = [
    { id: 1, status: "Approved", dates: "2023-06-20 to 2023-06-22", type: "Vacation" },
    { id: 2, status: "Pending", dates: "2023-07-05 to 2023-07-07", type: "Personal" }
  ];
  
  const todaySchedule = [
    { id: 1, time: "09:00 AM", title: "Morning Briefing" },
    { id: 2, time: "11:00 AM", title: "Project Status Update" },
    { id: 3, time: "02:00 PM", title: "Client Call" },
    { id: 4, time: "04:30 PM", title: "Team Sync-up" }
  ];

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
            onClick={() => navigate('/time-tracking')}
            color="secondary"
          >
            Clock In/Out
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/leave-requests')}
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
                <Button size="small" onClick={() => navigate('/announcements')} color="primary">
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
                              {announcement.date}
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
                <Button size="small" onClick={() => navigate('/calendar')} color="primary">
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
                <Button size="small" onClick={() => navigate('/job-assignments')} color="primary">
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
                <Button size="small" onClick={() => navigate('/leave-requests')} color="primary">
                  New Request
                </Button>
              }
              sx={{ backgroundColor: 'rgba(94, 46, 142, 0.05)' }}
            />
            <Divider />
            <CardContent>
              <List>
                {leaveRequests.map((request, index) => (
                  <React.Fragment key={request.id}>
                    <ListItem>
                      <ListItemText
                        primary={`${request.type} Leave`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="primary">
                              {request.status}
                            </Typography>
                            {` — ${request.dates}`}
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