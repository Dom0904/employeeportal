import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  const navigate = useNavigate();

  return (
    <Paper sx={{ 
      p: 4, 
      textAlign: 'center', 
      height: '100%',
      borderTop: '4px solid',
      borderColor: 'secondary.main',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          py: 5,
          maxWidth: '600px'
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom color="primary.main">
          {title}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph align="center">
          {description || 'This page is currently under development.'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Check back soon for updates or contact your administrator for more information.
        </Typography>
        
        <Button 
          variant="contained" 
          color="secondary"
          onClick={() => navigate('/dashboard')}
          sx={{ fontWeight: 'medium' }}
        >
          Back to Dashboard
        </Button>
      </Box>
    </Paper>
  );
};

export default PlaceholderPage; 