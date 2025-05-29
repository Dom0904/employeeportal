import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { Box, Paper, Typography, IconButton, Grid, Button, Badge, List, ListItem, ListItemText, Divider, Popover } from '@mui/material';
import { ChevronLeft, ChevronRight, Today as TodayIcon } from '@mui/icons-material';

import type { Job } from '../contexts/JobContext';

interface JobCalendarProps {
  jobs: Job[];
  onJobSelect: (jobId: string) => void;
  selectedJobId: string | null;
  initialDate?: Date;
}

const JobCalendar: React.FC<JobCalendarProps> = ({ jobs, onJobSelect, selectedJobId, initialDate = new Date() }) => {

  
  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<Job[]>([]);

  // Get the first and last day of the current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Get all days in the current month view
  const daysInMonth = eachDayOfInterval({
    start: monthStart,
    end: monthEnd
  });

  // Group jobs by date
  const jobsByDate = useMemo(() => {
    const jobsByDateMap = new Map<string, any[]>();
    
    jobs.forEach(job => {
      const jobStart = new Date(job.timeStart);
      const jobEnd = new Date(job.timeEnd);
      
      // For multi-day jobs, add them to each day they span
      const currentDate = new Date(jobStart);
      while (currentDate <= jobEnd) {
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        if (!jobsByDateMap.has(dateKey)) {
          jobsByDateMap.set(dateKey, []);
        }
        jobsByDateMap.get(dateKey)?.push(job);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
    return jobsByDateMap;
  }, [jobs]);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const handleDateClick = (day: Date, event: React.MouseEvent<HTMLDivElement>) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const jobsForDay = jobsByDate.get(dateKey) || [];
    
    if (jobsForDay.length > 0) {
      setSelectedDate(day);
      setSelectedJobs(jobsForDay);
      setAnchorEl(event.currentTarget);
    } else {
      setSelectedDate(day);
      setAnchorEl(null);
    }
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const handleJobClick = (jobId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onJobSelect(jobId);
    handleClosePopover();
  };

  const renderDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayJobs = jobsByDate.get(dateKey) || [];
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
    const isToday = isSameDay(day, new Date());
    
    // Get unique job colors for this day
    const jobColors = Array.from(new Set(dayJobs.map(job => job.color || '#2196F3')));
    
    return (
      <Box
        key={dateKey}
        onClick={(e) => handleDateClick(day, e as any)}
        sx={{
          minHeight: 100,
          border: '1px solid',
          borderColor: 'divider',
          p: 0.5,
          bgcolor: isSelected ? 'action.selected' : 'background.paper',
          opacity: isCurrentMonth ? 1 : 0.5,
          position: 'relative',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: isToday ? 'primary.main' : 'transparent',
            color: isToday ? 'primary.contrastText' : 'text.primary',
            mb: 0.5,
            mx: 'auto',
          }}
        >
          <Typography variant="caption" fontWeight={isToday ? 'bold' : 'normal'}>
            {format(day, 'd')}
          </Typography>
        </Box>
        
        {/* Job indicators */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
          {jobColors.slice(0, 3).map((color, index) => (
            <Box 
              key={index} 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                bgcolor: color,
                border: '1px solid white'
              }} 
            />
          ))}
          {jobColors.length > 3 && (
            <Typography variant="caption" color="textSecondary">
              +{jobColors.length - 3}
            </Typography>
          )}
        </Box>
        
        {/* Show count of jobs if any */}
        {dayJobs.length > 0 && (
          <Typography 
            variant="caption" 
            sx={{
              position: 'absolute',
              bottom: 2,
              right: 4,
              color: 'text.secondary',
              fontWeight: 'medium',
            }}
          >
            {dayJobs.length} job{dayJobs.length !== 1 ? 's' : ''}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="h2">
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
          <IconButton onClick={handleToday} size="small" sx={{ ml: 1 }}>
            <TodayIcon />
          </IconButton>
        </Box>
        <Box>
          <IconButton onClick={handlePrevMonth} size="small">
            <ChevronLeft />
          </IconButton>
          <IconButton onClick={handleNextMonth} size="small">
            <ChevronRight />
          </IconButton>
        </Box>
      </Box>
      
      {/* Day headers */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)',
        textAlign: 'center',
        fontWeight: 'bold',
        mb: 1,
      }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Typography key={day} variant="caption" color="text.secondary">
            {day}
          </Typography>
        ))}
      </Box>
      
      {/* Calendar grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 0.5,
        flexGrow: 1,
      }}>
        {daysInMonth.map(day => renderDay(day))}
      </Box>
      
      {/* Job details popover */}
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle1" gutterBottom>
            {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </Typography>
          <Divider sx={{ my: 1 }} />
          
          {selectedJobs.length > 0 ? (
            <List dense disablePadding>
              {selectedJobs.map((job) => (
                <React.Fragment key={job.id}>
                  <ListItem 
                    button 
                    onClick={(e) => handleJobClick(job.id, e)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box 
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: job.color || 'primary.main',
                              mr: 1,
                              flexShrink: 0,
                            }}
                          />
                          <Typography 
                            variant="body2" 
                            noWrap 
                            sx={{ 
                              fontWeight: 'medium',
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {job.title}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography 
                          variant="caption" 
                          color="textSecondary"
                          sx={{
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {format(new Date(job.timeStart), 'h:mm a')} - {format(new Date(job.timeEnd), 'h:mm a')}
                        </Typography>
                      }
                      sx={{ my: 0 }}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No jobs scheduled for this day
            </Typography>
          )}
        </Box>
      </Popover>
    </Paper>
  );
};

export default JobCalendar;
