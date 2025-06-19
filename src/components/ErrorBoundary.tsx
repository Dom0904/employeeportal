import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log error info here if needed
    // console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6">Something went wrong.</Typography>
            {this.state.error && <Typography variant="body2">{this.state.error.message}</Typography>}
          </Alert>
          <Button variant="contained" color="primary" onClick={this.handleReload}>
            Reload Page
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary; 