'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Button, AppBar, Toolbar, CircularProgress, Avatar, Menu, MenuItem } from '@mui/material';
import { Logout, Visibility, Person } from '@mui/icons-material';
import { AdminAuth } from '@/components/AdminAuthentification';

interface User {
  username: string;
  email: string;
}
// what if you have multiple admin pages do you want to do the check everytime 

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        clearAuthCookies();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      clearAuthCookies();
    } finally {
      setLoading(false);
    }
  };

  const clearAuthCookies = () => {
    document.cookie = 'admin-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  };

  const handleAuthenticated = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      handleMenuClose();
      clearAuthCookies();
      router.push('/');
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="primary" size={40} />
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            Loading...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={handleAuthenticated} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Admin Navigation */}
      <AppBar position="static" color="default" elevation={1} sx={{ backgroundColor: 'white' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
            Chivent Admin
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<Visibility />}
              onClick={() => router.push('/')}
              color="inherit"
              sx={{ textTransform: 'none' }}
            >
              View Site
            </Button>
            
            <Button
              startIcon={<Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>}
              onClick={handleMenuClick}
              color="inherit"
              sx={{ textTransform: 'none' }}
            >
              {user?.username}
            </Button>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleMenuClose} disabled>
                <Person sx={{ mr: 1 }} />
                {user?.email}
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Admin Content */}
      <Box sx={{ p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}