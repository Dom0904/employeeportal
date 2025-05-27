import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Tabs, 
  Tab, 
  Paper,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider
} from '@mui/material';
import { CalendarMonth as CalendarIcon, List as ListIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';
import { JobCalendar, JobDetails, JobList } from '../components';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';

const JobSchedule: React.FC = () => {
  const { user } = useAuth();
  const { jobs, getJobsByUser, getJobById } = useJobs();
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState<number>(520);
  const [dragging, setDragging] = useState<boolean>(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Get jobs for the current user
  const userJobs = getJobsByUser(user?.id || '');

  // Drag handle events
  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    setDragging(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      setSidebarWidth(Math.max(320, Math.min(700, startWidth - delta)));
    };
    const onMouseUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };


  // Group jobs by status
  const jobsByStatus = {
    upcoming: userJobs.filter(job => {
      const now = new Date();
      const start = new Date(job.timeStart);
      return now < start && (job.status === 'pending' || job.status === 'acknowledged');
    }),
    inProgress: userJobs.filter(job => {
      const now = new Date();
      const start = new Date(job.timeStart);
      const end = new Date(job.timeEnd);
      return (now >= start && now <= end) || job.status === 'in-progress';
    }),
    completed: userJobs.filter(job => {
      const now = new Date();
      const end = new Date(job.timeEnd);
      return now > end || job.status === 'completed' || job.status === 'cancelled';
    })
  };

  const selectedJob = selectedJobId ? getJobById(selectedJobId) : null;

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={view}
          onChange={(_, newValue) => setView(newValue)}
          aria-label="job schedule view"
        >
          <Tab 
            icon={<CalendarIcon />} 
            label={!isMobile && "Calendar"} 
            value="calendar"
            aria-label="calendar view"
          />
          <Tab 
            icon={<ListIcon />} 
            label={!isMobile && "List"} 
            value="list"
            aria-label="list view"
          />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', gap: 2, overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {view === 'calendar' ? (
            <JobCalendar 
              jobs={userJobs}
              onJobSelect={handleJobSelect}
              selectedJobId={selectedJobId}
            />
          ) : (
            <JobList 
              jobsByStatus={jobsByStatus}
              onJobSelect={handleJobSelect}
              selectedJobId={selectedJobId}
              userId={user?.id || ''}
            />
          )}
        </Box>
        {/* Drag handle for resizing sidebar */}
        {selectedJob && (
          <Box
            sx={{
              width: 8, cursor: 'col-resize', zIndex: 1,
              bgcolor: dragging ? 'primary.light' : 'divider',
              transition: 'background 0.2s',
              '&:hover': { bgcolor: 'primary.main' },
              userSelect: 'none',
              display: { xs: 'none', md: 'block' }
            }}
            onMouseDown={handleDrag}
          />
        )}
        {selectedJob && (
          <Paper 
            sx={{ 
              width: { xs: '100%', md: sidebarWidth },
              maxWidth: { xs: '100vw', md: 700 },
              minWidth: { xs: '100%', md: 320 },
              p: 2,
              boxSizing: 'border-box',
              display: { xs: selectedJobId ? 'block' : 'none', md: 'block' },
              overflowY: 'auto',
              height: { xs: 'auto', md: '100%' },
              maxHeight: '100vh',
              flexShrink: 0
            }}
          >
            <JobDetails 
              job={selectedJob}
              onClose={() => setSelectedJobId(null)}
            />
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default JobSchedule;
