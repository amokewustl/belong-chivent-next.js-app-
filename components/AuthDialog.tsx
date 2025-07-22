'use client';

import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, Button, Typography, Alert, CircularProgress, Box, Tabs, Tab, IconButton, InputAdornment} from '@mui/material';
import { Login as LoginIcon, PersonAdd, Visibility, VisibilityOff } from '@mui/icons-material';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (credentials: { username: string; password: string }) => Promise<void>;
  onRegister?: (userData: any) => Promise<void>;
  error?: string | null; 
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const AuthDialog: React.FC<AuthDialogProps> = ({ open, onClose, onSubmit, onRegister, error: propError }) => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  // Registration form state
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    adminCode: ''
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    setError('');
    setSuccess('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        username: loginData.username,
        password: loginData.password
      });
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      if (onRegister) {
        await onRegister({
          username: registerData.username,
          email: registerData.email,
          password: registerData.password,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          phone: registerData.phone,
          adminCode: registerData.adminCode
        });
        setSuccess('Registration successful! Please login.');
        setTab(0); // Switch to login tab
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    setLoginData({ username: '', password: '' });
    setRegisterData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      adminCode: ''
    });
    onClose();
  };

  // Use prop error if available, otherwise use local error
  const displayError = propError || error;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle 
      component="div"
      sx={{ textAlign: 'center', pb: 1 }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
          Chivent
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your gateway to amazing events
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={handleTabChange} variant="fullWidth">
            <Tab icon={<LoginIcon />} label="Login" />
            <Tab icon={<PersonAdd />} label="Register" />
          </Tabs>
        </Box>

        {displayError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {displayError}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}

        {/* Login Tab */}
        <TabPanel value={tab} index={0}>
          <form onSubmit={handleLoginSubmit}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              value={loginData.username}
              onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              required
              sx={{ mb: 2 }}
              disabled={loading}
              autoComplete="username"
            />
            
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              required
              sx={{ mb: 3 }}
              disabled={loading}
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
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
              color="primary"
              disabled={loading || !loginData.username.trim() || !loginData.password.trim()}
              sx={{ py: 1.5, textTransform: 'none', fontSize: '1rem' }}
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
        </TabPanel>

        {/* Register Tab */}
        <TabPanel value={tab} index={1}>
          <form onSubmit={handleRegisterSubmit}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                variant="outlined"
                value={registerData.firstName}
                onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                required
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Last Name"
                variant="outlined"
                value={registerData.lastName}
                onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                required
                disabled={loading}
              />
            </Box>

            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              value={registerData.username}
              onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
              required
              sx={{ mb: 2 }}
              disabled={loading}
              autoComplete="username"
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              variant="outlined"
              value={registerData.email}
              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
              required
              sx={{ mb: 2 }}
              disabled={loading}
              autoComplete="email"
            />

            <TextField
              fullWidth
              label="Phone (Optional)"
              variant="outlined"
              value={registerData.phone}
              onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
              sx={{ mb: 2 }}
              disabled={loading}
              autoComplete="tel"
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              value={registerData.password}
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
              required
              sx={{ mb: 2 }}
              disabled={loading}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              variant="outlined"
              value={registerData.confirmPassword}
              onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
              required
              sx={{ mb: 2 }}
              disabled={loading}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Admin Code (Optional)"
              variant="outlined"
              value={registerData.adminCode}
              onChange={(e) => setRegisterData({ ...registerData, adminCode: e.target.value })}
              sx={{ mb: 3 }}
              disabled={loading}
              helperText="Enter the admin code if you have one to get admin privileges"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ py: 1.5, textTransform: 'none', fontSize: '1rem' }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};