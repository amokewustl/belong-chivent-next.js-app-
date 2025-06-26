'use client';

import React, { useState, useEffect } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';

interface AdminAuthProps {
  onAuthenticated: (user: any) => void;
}

export const AdminAuth: React.FC<AdminAuthProps> = ({ onAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Clear any existing auth cookies
    document.cookie = 'admin-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim(), password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Login failed';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          console.error('Non-JSON error response:', errorText);
          errorMessage = `Server error (${response.status})`;
        }
        
        setError(errorMessage);
        return;
      }

      const data = await response.json();
      
      // Clear form on success
      setUsername('');
      setPassword('');
      setError('');
      onAuthenticated(data.user);

    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (error) setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'background.default',
      p: 3
    }}>
      <Paper sx={{ maxWidth: 400, width: '100%', p: 4 }} elevation={3}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <LoginIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
            Chivent Admin
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sign in to access the admin dashboard
          </Typography>
        </Box>
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            value={username}
            onChange={handleUsernameChange}
            required
            sx={{ mb: 2 }}
            disabled={loading}
            autoComplete="username"
            autoFocus
          />
          
          <TextField
            fullWidth
            label="Password"
            type="password"
            variant="outlined"
            value={password}
            onChange={handlePasswordChange}
            required
            sx={{ mb: 3 }}
            disabled={loading}
            autoComplete="current-password"
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading || !username.trim() || !password.trim()}
            sx={{ 
              py: 1.5,
              textTransform: 'none',
              fontSize: '1rem'
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
        
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Demo Credentials:
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            Username: admin<br />
            Password: admin123
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};