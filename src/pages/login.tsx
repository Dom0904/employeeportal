import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  InputAdornment,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Image from 'next/image';

const Login = () => {
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Construct the public URL for the logo from Supabase Storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const logoUrl = `${supabaseUrl}/storage/v1/object/public/public-images//Edgetech-logo.png`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!idNumber || !password) {
      setError('Please enter both ID number and password');
      return;
    }

    setLoading(true);
    try {
      const success = await login(idNumber, password);
      if (success) {
        router.replace('/dashboard');
      } else {
        setError('Invalid ID number or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f8f8'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 400,
          width: '100%',
        }}
      >
        <Box
          component="img"
          src={logoUrl}
          alt="EdgeTech Logo"
          sx={{ 
            width: 280,
            height: 'auto',
            mb: 3
          }}
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sign in with your employee credentials
        </Typography>
        
        <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="idNumber"
            label="ID Number"
            name="idNumber"
            autoComplete="username"
            autoFocus
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            variant="outlined"
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
          
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            For testing, use one of these IDs:
            <br />
            Admin: 1001
            <br />
            Moderator: 1002
            <br />
            Manager: 1003
            <br />
            User: 1004
            <br />
            Password: password
          </Typography>
        </Box>
      </Paper>
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login; 