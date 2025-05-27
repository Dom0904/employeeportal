import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  ListItemIcon,
  ListItemSecondaryAction,
  Chip, 
  Divider, 
  Paper,
  Button,
  useTheme
} from '@mui/material';
import { 
  AccessTime as TimeIcon, 
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { format, isToday, isTomorrow, isYesterday, isThisWeek, isSameDay, addDays } from 'date-fns';
import type { Job } from '../contexts/JobContext';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';
import { useNotifications } from '../contexts/NotificationContext';

interface JobsByStatus {
  upcoming: Job[];
  inProgress: Job[];
  completed: Job[];
}

interface JobListProps {
  showAcknowledgmentOnly?: boolean;
  userId: string;
  jobsByStatus: JobsByStatus;
  onJobSelect: (jobId: string) => void;
  selectedJobId: string | null;
  onAcknowledge?: (jobId: string) => void;
}

export const filterJobsByAcknowledgment = (jobs: Job[], userId: string) => {
  return jobs.filter(job => {
    const isAssignedToUser = job.personnelIds.includes(userId) || job.driverId === userId;
    const needsAcknowledgment = !job.acknowledgedBy.includes(userId);
    const isAcknowledgeable = job.status === 'pending' || job.status === 'acknowledged';
    return isAssignedToUser && needsAcknowledgment && isAcknowledgeable;
  });
};

export const JobList: React.FC<JobListProps> = ({ jobsByStatus, onJobSelect, selectedJobId, onAcknowledge, showAcknowledgmentOnly = false, userId }) => {
  const { user } = useAuth();
  const { acknowledgeJob } = useJobs();
  const { showNotification } = useNotifications();
  const theme = useTheme();
  
  // Group jobs by date
  const groupJobsByDate = (jobs: Job[]) => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const yesterday = addDays(today, -1);
    
    const groups: { [key: string]: Job[] } = {
      'Today': [],
      'Tomorrow': [],
      'Yesterday': [],
      'This Week': [],
      'Upcoming': [],
      'Past': []
    };
    
    jobs.forEach(job => {
      const jobDate = new Date(job.timeStart);
      
      if (isToday(jobDate)) {
        groups['Today'].push(job);
      } else if (isTomorrow(jobDate)) {
        groups['Tomorrow'].push(job);
      } else if (isYesterday(jobDate)) {
        groups['Yesterday'].push(job);
      } else if (isThisWeek(jobDate, { weekStartsOn: 1 })) {
        groups['This Week'].push(job);
      } else if (jobDate > today) {
        groups['Upcoming'].push(job);
      } else {
        groups['Past'].push(job);
      }
    });
    
    // Sort jobs within each group by time
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => 
        new Date(a.timeStart).getTime() - new Date(b.timeStart).getTime()
      );
    });
    
    // Remove empty groups
    return Object.entries(groups)
      .filter(([_, jobs]) => jobs.length > 0)
      .map(([title, jobs]) => ({ title, jobs }));
  };
  
  const needsAcknowledgment = (job: Job) => {
    if (!user) return false;
    const isAssignedToUser = job.personnelIds.includes(user.id) || job.driverId === user.id;
    const isAcknowledgeable = job.status === 'pending' || job.status === 'acknowledged';
    return isAssignedToUser && !job.acknowledgedBy.includes(user.id) && isAcknowledgeable;
  };

  const handleAcknowledge = (jobId: string) => {
    if (!user) return;
    acknowledgeJob(jobId, user.id);
    
    // Add notification for the supervisor
    const job = jobsByStatus.upcoming.find(j => j.id === jobId) || 
                jobsByStatus.inProgress.find(j => j.id === jobId);
    if (job) {
      showNotification({
        message: `${user.name || 'A user'} has acknowledged the job: ${job.title}`,
        type: 'success',
        link: `/jobs/${jobId}`,
        metadata: { jobId, type: 'job_acknowledged', userId: user.id, supervisorId: job.supervisorId }
      });
    }
    
    if (onAcknowledge) {
      onAcknowledge(jobId);
    }
  };

  const renderJobItem = (job: Job) => {
    const startDate = new Date(job.timeStart);
    const endDate = new Date(job.timeEnd);
    const isSelected = selectedJobId === job.id;
    
    const getStatusInfo = () => {
      const now = new Date();
      if (job.status === 'completed') return { text: 'Completed', color: 'success' as const, icon: <CheckCircleIcon fontSize="small" /> };
      if (job.status === 'cancelled') return { text: 'Cancelled', color: 'error' as const, icon: <ErrorIcon fontSize="small" /> };
      if (now > endDate) return { text: 'Overdue', color: 'error' as const, icon: <ErrorIcon fontSize="small" /> };
      if (now >= startDate && now <= endDate) return { text: 'In Progress', color: 'info' as const, icon: <PendingIcon fontSize="small" /> };
      return { text: 'Scheduled', color: 'primary' as const, icon: <TimeIcon fontSize="small" /> };
    };
    
    const status = getStatusInfo();
    
    return (
      <ListItem 
        key={job.id} 
        disablePadding 
        sx={{ 
          mb: 0.5,
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: isSelected ? 'action.selected' : 'background.paper',
          '&:hover': {
            bgcolor: isSelected ? 'action.selected' : 'action.hover',
          },
        }}
      >
        <ListItemButton 
          onClick={() => onJobSelect(job.id)}
          sx={{ py: 1.5, px: 2 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Box 
              sx={{ 
                width: 10, 
                height: 10, 
                borderRadius: '50%', 
                bgcolor: job.color || 'primary.main',
                border: '2px solid white',
                boxShadow: 1,
              }} 
            />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography 
                  variant="subtitle2" 
                  noWrap 
                  sx={{ 
                    fontWeight: isSelected ? 'bold' : 'medium',
                    maxWidth: '70%',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {job.title}
                </Typography>
                <Chip
                  size="small"
                  label={status.text}
                  color={status.color}
                  icon={status.icon}
                  sx={{ 
                    height: 20, 
                    fontSize: '0.65rem',
                    '& .MuiChip-icon': { 
                      color: 'inherit',
                      margin: '0 2px 0 -4px',
                    },
                  }}
                />
              </Box>
            }
            secondary={
              <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    '& svg': {
                      fontSize: '0.9em',
                      mr: 0.5,
                      color: 'text.secondary',
                    }
                  }}
                >
                  <TimeIcon fontSize="inherit" />
                  {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {job.siteAddress}
                </Typography>
                {needsAcknowledgment(job) && (
                  <Box sx={{ mt: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleAcknowledge(job.id);
                      }}
                    >
                      Acknowledge
                    </Button>
                  </Box>
                )}
              </Box>
            }
          />
        </ListItemButton>
      </ListItem>
    );
  };
  
  const renderJobGroup = (title: string, jobs: Job[]) => {
    if (jobs.length === 0) return null;
    
    return (
      <Box key={title} sx={{ mb: 3 }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 'bold', 
            color: 'text.secondary',
            mb: 1,
            px: 2,
            py: 1,
            bgcolor: 'background.default',
            borderRadius: 1,
            display: 'inline-block',
          }}
        >
          {title}
        </Typography>
        <Paper 
          elevation={0} 
          sx={{ 
            border: '1px solid', 
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <List disablePadding>
            {jobs.map(job => renderJobItem(job))}
          </List>
        </Paper>
      </Box>
    );
  };
  
  // Group jobs by status
  const jobGroups = [
    { 
      title: 'In Progress', 
      jobs: showAcknowledgmentOnly ? filterJobsByAcknowledgment(jobsByStatus.inProgress, userId) : jobsByStatus.inProgress 
    },
    { 
      title: 'Upcoming', 
      jobs: showAcknowledgmentOnly ? filterJobsByAcknowledgment(jobsByStatus.upcoming, userId) : jobsByStatus.upcoming 
    },
    { 
      title: 'Completed', 
      jobs: showAcknowledgmentOnly ? filterJobsByAcknowledgment(jobsByStatus.completed, userId) : jobsByStatus.completed 
    },
  ];
  
  // If no jobs at all
  if (jobGroups.every(group => group.jobs.length === 0)) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        textAlign: 'center',
        p: 3
      }}>
        <TimeIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No jobs scheduled
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You don't have any jobs scheduled at the moment.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', overflowY: 'auto', p: 1 }}>
      {jobGroups.map(group => 
        group.jobs.length > 0 ? (
          <Box key={group.title}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 'bold', 
                color: 'text.secondary',
                mb: 1,
                px: 1,
              }}
            >
              {group.title} ({group.jobs.length})
            </Typography>
            <Paper 
              elevation={0} 
              sx={{ 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                mb: 3,
              }}
            >
              <List disablePadding>
                {group.jobs.map(job => renderJobItem(job))}
              </List>
            </Paper>
          </Box>
        ) : null
      )}
    </Box>
  );
};
