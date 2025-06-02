import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Grid,
  TextField,
  Button,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { useAuth, User } from '../contexts/AuthContext';

// User type with jobPosition field
interface UserWithJobPosition extends User {
  jobPosition: string;
}

const PersonalInfo = () => {
  const { user, updateUserProfile } = useAuth() as any;
  const [editing, setEditing] = useState(false);
  const [userInfo, setUserInfo] = useState<UserWithJobPosition | null>(user ? {
    ...user,
    jobPosition: user.position || 'Software Engineer',
  } : null);
  const [savedUserInfo, setSavedUserInfo] = useState<UserWithJobPosition | null>(userInfo);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle profile picture change
  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          setUserInfo(prev => prev ? {
            ...prev,
            profilePicture: e.target?.result as string
          } : null);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserInfo(prev => prev ? { ...prev, [name]: value } : null);
  };

  // Start editing
  const handleEditClick = () => {
    setEditing(true);
  };

  // Cancel editing
  const handleCancelClick = () => {
    setEditing(false);
    setUserInfo(savedUserInfo);
    setSnackbarMessage('Changes discarded');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  };

  // Save changes
  const handleSaveClick = async () => {
    try {
      // In a real app, this would call an API to update the user profile
      // For now, we'll just simulate success
      setSavedUserInfo(userInfo);
      setEditing(false);
      setSnackbarMessage('Profile updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // If you have an updateUserProfile function in your auth context
      if (updateUserProfile && userInfo) {
        await updateUserProfile(userInfo);
      }
    } catch (error) {
      setSnackbarMessage('Failed to update profile');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Trigger file input click
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Personal Information
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {/* Profile Picture Section */}
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar 
              src={userInfo?.profilePicture || '/assets/default-avatar.png'} 
              alt={userInfo?.name || 'User'} 
              sx={{ width: 200, height: 200, mb: 2 }}
            />
            {editing && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleProfilePictureChange}
                />
                <Button
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  onClick={handleUploadClick}
                >
                  Upload Photo
                </Button>
              </>
            )}
          </Grid>
          
          {/* Personal Details Section */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={userInfo?.name || ''}
                  onChange={handleInputChange}
                  disabled={!editing}
                  variant={editing ? "outlined" : "filled"}
                  InputProps={{
                    readOnly: !editing,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Job Position"
                  name="jobPosition"
                  value={userInfo?.jobPosition || ''}
                  onChange={handleInputChange}
                  disabled={!editing}
                  variant={editing ? "outlined" : "filled"}
                  InputProps={{
                    readOnly: !editing,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  value={userInfo?.phoneNumber || ''}
                  onChange={handleInputChange}
                  disabled={!editing}
                  variant={editing ? "outlined" : "filled"}
                  InputProps={{
                    readOnly: !editing,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={userInfo?.email || ''}
                  onChange={handleInputChange}
                  disabled={!editing}
                  variant={editing ? "outlined" : "filled"}
                  InputProps={{
                    readOnly: !editing,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ID Number"
                  name="id"
                  value={userInfo?.id || ''}
                  disabled={true}
                  variant="filled"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Role"
                  name="role"
                  value={userInfo?.role || ''}
                  disabled={true}
                  variant="filled"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
          
          {/* Action Buttons */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            {!editing ? (
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<EditIcon />}
                onClick={handleEditClick}
              >
                Edit
              </Button>
            ) : (
              <>
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  startIcon={<CancelIcon />}
                  onClick={handleCancelClick}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<SaveIcon />}
                  onClick={handleSaveClick}
                >
                  Save
                </Button>
              </>
            )}
          </Grid>
        </Grid>
      </Paper>
      
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

export default PersonalInfo; 
