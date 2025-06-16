import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader, 
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip
} from '@mui/material';
import { 
  Work as WorkIcon, 
  LocationOn as LocationIcon, 
  Person as PersonIcon, 
  AccessTime as TimeIcon,
  CheckCircle as CheckCircleIcon,
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { isPast, isFuture, format } from 'date-fns';
import { Job } from '../contexts/JobContext';
import { useAuth } from '../contexts/AuthContext';

interface JobDetailsProps {
  job: Job;
  onClose?: () => void;
  onEdit?: (jobId: string) => void;
  onAcknowledge?: (jobId: string) => void;
  showFullDetails?: boolean;
  showActions?: boolean;
}

// Helper to get initials from a name or ID
const getInitials = (idOrName: string) => {
  if (!idOrName) return '';
  const parts = idOrName.split(/\s|_/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.map(s => s[0]).join('').toUpperCase().slice(0, 2);
};

const JobDetails: React.FC<JobDetailsProps> = ({
  job,
  onClose,
  onEdit,
  onAcknowledge,
  showFullDetails = true,
  showActions = true
}) => {
  const { user } = useAuth();
  
  const startDate = new Date(job.timeStart || 0);
  const endDate = new Date(job.timeEnd || 0);
  const isAcknowledged = Array.isArray(job.acknowledged_at) && job.acknowledged_at.includes(user?.id || '');
  const isAssigned = user && ((job.personnelIds ?? []).includes(user.id) || job.driver_id === user.id);
  
  // Determine job status
  const getJobStatus = () => {
  
    if (job.status === 'completed') return 'Completed';
    if (job.status === 'cancelled') return 'Cancelled';
    if (isPast(endDate)) return 'Completed';
    if (isFuture(startDate)) return 'Scheduled';
    return 'In Progress';
  };

  const getStatusColor = () => {
    switch (getJobStatus().toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in progress':
        return 'info';
      case 'scheduled':
        return 'primary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleAcknowledge = () => {
    if (onAcknowledge) {
      onAcknowledge(job.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(job.id);
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        maxWidth: 800, 
        width: '100%',
        mx: 'auto',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText',
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <WorkIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="h2" noWrap>
            {job.title}
          </Typography>
          <Chip 
            label={getJobStatus()} 
            color={getStatusColor()}
            size="small"
            sx={{ ml: 2, color: 'white', bgcolor: `${getStatusColor()}.dark` }}
          />
        </Box>
        {onClose && (
          <IconButton 
            onClick={onClose} 
            size="small" 
            sx={{ color: 'primary.contrastText' }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      
      <Box sx={{ p: 3 }}>
        {/* Job Info */}
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={showFullDetails ? 8 : 12}>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardHeader 
                title="Job Details"
                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
                sx={{ 
                  bgcolor: 'background.default',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  py: 1,
                }}
              />
              <CardContent>
                <List disablePadding>
                  <ListItem disableGutters>
                    <ListItemIcon>
                      <LocationIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={job.siteAddress}
                      secondary="Site Address"
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon>
                      <TimeIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        format(startDate, 'PPpp') + ' - ' + format(endDate, 'PPpp')
                      }
                      secondary="Schedule"
                    />
                  </ListItem>
                  
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Supervisor" 
                      secondary={job.supervisorId || 'Not assigned'}
                      // In a real app, you'd look up the supervisor's name by ID
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Right Column - Only show in full details view */}
          {showFullDetails && (
            <Grid item xs={12} md={4}>
              {/* Assigned Personnel */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardHeader 
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', fontSize: 22 }}>
                      <PeopleIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
                      <span style={{ fontWeight: 700, fontSize: 22 }}>Assigned Personnel</span>
                    </Box>
                  }
                  titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                  sx={{ 
                    bgcolor: 'primary.light',
                    borderBottom: '2px solid',
                    borderColor: 'primary.main',
                    py: 2,
                  }}
                />
                <CardContent sx={{ p: 2, bgcolor: 'primary.lighter', minHeight: 90, width: '100%', boxSizing: 'border-box' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, width: '100%' }}>
                    {(job.personnelIds ?? []).length > 0 ? (
                      (job.personnelIds ?? []).map(pid => {
                        const acknowledged = Array.isArray(job.acknowledged_at) && job.acknowledged_at.includes(pid);
                        return (
                          <Chip
                            key={pid}
                            avatar={<Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 20 }}>{pid.charAt(0).toUpperCase()}</Avatar>}
                            label={
                              <span style={{ fontSize: 18, fontWeight: 600, whiteSpace: 'normal', wordBreak: 'break-all', textAlign: 'left', width: '100%', display: 'block' }}>
                                {pid}
                                {acknowledged ? ' ✅' : ' ⏳'}
                              </span>
                            }
                            color={acknowledged ? 'success' : 'warning'}
                            sx={{ height: 48, fontSize: 18, px: 2, py: 1, boxShadow: 2, minWidth: 0, maxWidth: '100%', width: '100%', justifyContent: 'flex-start', '.MuiChip-label': { width: '100%', overflowWrap: 'break-word', whiteSpace: 'normal', textOverflow: 'clip', textAlign: 'left', display: 'block' } }}
                            variant="filled"
                          />
                        );
                      })
                    ) : (
                      <Chip label="No personnel assigned" color="warning" sx={{ height: 48, fontSize: 18, px: 2, py: 1, minWidth: 0, maxWidth: '100%', width: '100%' }} />
                    )}
                  </Box>
                </CardContent>
              </Card>
              
              {/* Driver - Always show section */}
              <Card variant="outlined">
                <CardHeader 
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', fontSize: 22 }}>
                      <CarIcon sx={{ mr: 1, fontSize: 32, color: 'secondary.main' }} />
                      <span style={{ fontWeight: 700, fontSize: 22 }}>Assigned Driver</span>
                    </Box>
                  }
                  titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                  sx={{ 
                    bgcolor: 'secondary.light',
                    borderBottom: '2px solid',
                    borderColor: 'secondary.main',
                    py: 2,
                  }}
                />
                <CardContent sx={{ p: 2, bgcolor: 'secondary.lighter', minHeight: 90, width: '100%', boxSizing: 'border-box' }}>
                  {job.driver_id ? (
                    <Chip
                      avatar={<Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main', fontSize: 20 }}>{getInitials(job.driver_id)}</Avatar>}
                      label={
                        <span style={{ fontSize: 18, fontWeight: 600, whiteSpace: 'normal', wordBreak: 'break-all', textAlign: 'left', width: '100%', display: 'block' }}>
                          {job.driver_id}
                          {Array.isArray(job.acknowledged_at) && job.acknowledged_at.includes(job.driver_id) ? ' ✅' : ' ⏳'}
                        </span>
                      }
                      color={Array.isArray(job.acknowledged_at) && job.acknowledged_at.includes(job.driver_id) ? 'success' : 'warning'}
                      sx={{ height: 48, fontSize: 18, px: 2, py: 1, boxShadow: 2, minWidth: 0, maxWidth: '100%', width: '100%', justifyContent: 'flex-start', '.MuiChip-label': { width: '100%', overflowWrap: 'break-word', whiteSpace: 'normal', textOverflow: 'clip', textAlign: 'left', display: 'block' } }}
                      variant="filled"
                    />
                  ) : (
                    <Chip label="No driver assigned" color="warning" sx={{ height: 48, fontSize: 18, px: 2, py: 1, minWidth: 0, maxWidth: '100%', width: '100%' }} />
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
        
        {/* Actions */}
        {showActions && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            {onEdit && (
              <Button 
                variant="outlined" 
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                Edit Job
              </Button>
            )}
            
            {isAssigned && !isAcknowledged && getJobStatus() !== 'Completed' && getJobStatus() !== 'Cancelled' && (
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<CheckCircleIcon />}
                onClick={handleAcknowledge}
              >
                Acknowledge
              </Button>
            )}
            
            {isAcknowledged && (
              <Button 
                variant="outlined" 
                color="success"
                startIcon={<CheckCircleIcon />}
                disabled
              >
                Acknowledged
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default JobDetails;
