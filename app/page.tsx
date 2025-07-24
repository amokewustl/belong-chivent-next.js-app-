'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Button, CircularProgress, Alert, Box, AppBar, Toolbar, Avatar, Menu, MenuItem, Divider } from '@mui/material';
import { Login as LoginIcon, Person, Logout, AdminPanelSettings } from '@mui/icons-material';
import { Event } from '@/types';
import { fetchEnoughEvents } from '@/lib/api';
import { EventCard } from '@/components/EventCard';
import { AuthDialog } from '@/components/AuthDialog';
import { useUser } from '@/context/UserContext';

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}
// make date and times more readable - done
// fix id's on admin page to the id's in the database - done
// fix create/ delete/ update event
//have a page for each event
//ticketing options
//sort/ search bar 
//profile page

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const User = useUser();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const loadEvents = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const { events: fetchedEvents } = await fetchEnoughEvents(20, 5, page);
      console.log(fetchedEvents);
      setEvents(fetchedEvents);
    } catch (err) {
      setError('Failed to load events. Please try again.');
      console.error('Error loading events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        User.checkAuth();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    loadEvents(currentPage);
  }, [currentPage]);

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleLoginClick = () => {
    setAuthDialogOpen(true);
  };

  const handleLogin = async (credentials: { username: string; password: string }) => {
    setLoginError(null);
    try {
      const result = await User.login(credentials);
      
      if (result.success) {
        setAuthDialogOpen(false);
        await loadEvents(currentPage);
      } else {
        setLoginError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An unexpected error occurred');
    }
  };

  const handleRegister = async (userData: any) => {
    setLoginError(null);
    try {
      const result = await User.register(userData);
      
      if (!result.success) {
        setLoginError(result.error || 'Registration failed');
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error; 
    }
  };

  const handleAuthDialogClose = () => {
    setAuthDialogOpen(false);
  };


  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };


  const handleAdminPanel = () => {
    handleProfileMenuClose();
    window.location.href = '/admin';
  };

  const getUserDisplayName = () => {
    if (User.user?.firstName && User.user?.lastName) {
      return `${User.user.firstName} ${User.user.lastName}`;
    }
    return User.user?.username || 'User';
  };

  const getUserInitial = () => {
    if (User.user?.firstName) {
      return User.user.firstName.charAt(0).toUpperCase();
    }
    return User.user?.username?.charAt(0).toUpperCase() || 'U';
  };

  if (authLoading) {
    return (
      <Box className="loading-container">
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="primary" size={40} />
          <Typography className="loading-text" sx={{ mt: 2 }}>
            Loading...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Login/Profile */}
      <AppBar position="static" sx={{ mb: 4 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Chivent
          </Typography>
          
          {User.user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
                Welcome, {getUserDisplayName()}
              </Typography>
              <Button
                onClick={handleProfileMenuOpen}
                sx={{ minWidth: 'auto', p: 0.5 }}
              >
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: 'secondary.main',
                    fontSize: '0.875rem'
                  }}
                >
                  {getUserInitial()}
                </Avatar>
              </Button>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem disabled>
                  <Box>
                    <Typography variant="subtitle2">
                      {getUserDisplayName()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {User.user.email}
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleProfileMenuClose}>
                  <Person sx={{ mr: 1 }} />
                  Profile
                </MenuItem>
                {User.user.role === 'admin' && (
                  <MenuItem onClick={handleAdminPanel}>
                    <AdminPanelSettings sx={{ mr: 1 }} />
                    Admin Panel
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={User.logout}>
                  <Logout sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<LoginIcon />}
              onClick={handleLoginClick}
              sx={{ textTransform: 'none' }}
            >
              Login / Register
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ px: { xs: 2, md: 4 } }}>
        <Typography variant="h3" component="h1" color="primary" gutterBottom>
          Upcoming Events in Chicago
        </Typography>
        
        <Box className="button-group" sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePrevPage}
            disabled={currentPage <= 0}
          >
            Previous Page
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleNextPage}
          >
            Next Page
          </Button>
        </Box>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Page {currentPage + 1}
        </Typography>
        
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress color="primary" size={40} />
            <Typography sx={{ mt: 2 }}>
              Loading events...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Alert severity="error" sx={{ maxWidth: 400, mx: 'auto' }}>
              {error}
            </Alert>
          </Box>
        ) : (!events || events.length === 0) ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No events found for this page. Try another page or check back later.
            </Typography>
          </Box>
        ) : (
          <Box className="events-grid">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </Box>
        )}
      </Box>

      {/* Authentication Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onClose={handleAuthDialogClose}
        onSubmit={handleLogin}  // add register or login logic 
        onRegister={handleRegister}
        error = {loginError}
      />
    </Box>
  );
}