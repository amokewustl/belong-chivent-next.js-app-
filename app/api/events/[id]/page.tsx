'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Button, CircularProgress, Alert, Box, AppBar, Toolbar, Avatar, Menu, MenuItem, Divider, Card,
  CardMedia, Chip, Stack, Container ,Paper} from '@mui/material';
import { Login as LoginIcon, Person, Logout, AdminPanelSettings, LocationOn, Event as EventIcon, AccessTime, ShoppingCart,ArrowBack} from '@mui/icons-material';
import { useSearchParams, useRouter } from 'next/navigation';
import { Event } from '@/types';
import { useUser } from '@/context/UserContext';
import { useCart } from '@/context/CartContext';
import { AuthDialog } from '@/components/AuthDialog';
import { dayjs, Dayjs, Chronos } from '@jstiava/chronos';
new Chronos;

export default function EventsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams?.get('id');
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const User = useUser();
  const Cart = useCart();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails(eventId);
    } else {
      setError('No event ID provided');
      setLoading(false);
    }
  }, [eventId]);

  const fetchEventDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/events?targetCount=200&maxPages=10&page=0');
      if (!response.ok) {
        throw new Error('Failed to fetch event details');
      }
      
      const data = await response.json();
      const foundEvent = data.events.find((e: Event) => e.id === id);
      
      if (!foundEvent) {
        throw new Error('Event not found');
      }
      
      setEvent(foundEvent);
    } catch (err) {
      setError('Failed to load event details. Please try again.');
      console.error('Error loading event details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (dateString: string) => {
    const eventDate = dayjs(dateString);
    const today = dayjs();
    const tomorrow = today.add(1, 'day');
    const yesterday = today.subtract(1, 'day');
    
    if (eventDate.isSame(today, 'day')) {
      return `Today, ${eventDate.format('dddd')}`;
    } else if (eventDate.isSame(tomorrow, 'day')) {
      return `Tomorrow, ${eventDate.format('dddd')}`;
    } else if (eventDate.isSame(yesterday, 'day')) {
      return `Yesterday, ${eventDate.format('dddd')}`;
    } else if (eventDate.diff(today, 'days') <= 7 && eventDate.diff(today, 'days') > 1) {
      return eventDate.format('dddd, MMMM D');
    } else {
      return eventDate.format('dddd, M/D/YYYY');
    }
  };

  const formatEventTime = (timeString: string) => {
    if (timeString === 'TBA' || !timeString) {
      return 'TBA';
    }
    
    const cleanTime = timeString.trim();
    
    if (cleanTime.toLowerCase().includes('am') || cleanTime.toLowerCase().includes('pm')) {
      return cleanTime;
    }
    
    if (cleanTime.includes(':')) {
      const [hoursStr, minutesStr] = cleanTime.split(':');
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      
      if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const displayMinutes = minutes.toString().padStart(2, '0');
        return `${displayHours}:${displayMinutes} ${period}`;
      }
    }
    
    return cleanTime;
  };

  const handleAddToCart = () => {
    if (!User.isAuthenticated || !User.user) {
      setAuthDialogOpen(true);
      return;
    }
    
    if (event) {
      Cart.addToCart(event);
      alert(`${event.title} added to cart!`);
    }
  };

  const handleLogin = async (credentials: { username: string; password: string }) => {
    setLoginError(null);
    try {
      const result = await User.login(credentials);
      
      if (result.success) {
        setAuthDialogOpen(false);
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

  if (loading) {
    return (
      <Box>
        {/* Header */}
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
                onClick={() => setAuthDialogOpen(true)}
                sx={{ textTransform: 'none' }}
              >
                Login / Register
              </Button>
            )}
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress color="primary" size={40} />
            <Typography sx={{ mt: 2 }}>
              Loading event details...
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Box>
        {/* Header */}
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
              </Box>
            ) : (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<LoginIcon />}
                onClick={() => setAuthDialogOpen(true)}
                sx={{ textTransform: 'none' }}
              >
                Login / Register
              </Button>
            )}
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push('/')}
            sx={{ mb: 3 }}
          >
            Back to Events
          </Button>
          
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Alert severity="error" sx={{ maxWidth: 400, mx: 'auto' }}>
              {error || 'Event not found'}
            </Alert>
          </Box>
        </Container>
      </Box>
    );
  }

  const formattedDate = formatEventDate(event.startDate);
  const formattedTime = formatEventTime(event.startTime);

  return (
    <Box>
      {/* Header */}
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
              onClick={() => setAuthDialogOpen(true)}
              sx={{ textTransform: 'none' }}
            >
              Login / Register
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/')}
          sx={{ mb: 3 }}
        >
          Back to Events
        </Button>

        <Paper elevation={3} sx={{ overflow: 'hidden' }}>
          {/* Hero Image Section */}
          <Box sx={{ position: 'relative', height: 400 }}>
            <CardMedia
              component="img"
              height="400"
              image={event.image}
              alt={event.title}
              onError={(e) => { 
                e.currentTarget.src = "https://via.placeholder.com/800x400?text=Event+Image";
              }}
              sx={{ objectFit: 'cover' }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                p: 4
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                  <Typography variant="h3" component="h1" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                    {event.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <EventIcon sx={{ color: 'white' }} />
                      <Typography variant="h6" sx={{ color: 'white' }}>
                        {formattedDate}
                      </Typography>
                    </Box>
                    {formattedTime !== 'TBA' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTime sx={{ color: 'white' }} />
                        <Typography variant="h6" sx={{ color: 'white' }}>
                          {formattedTime}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
                <Chip
                  label={event.price}
                  color="error"
                  //size="large"
                  sx={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: 'white',
                    px: 2,
                    py: 1
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Event Details Section */}
          <Box sx={{ p: 4 }}>
            <Stack spacing={4}>
              {/* Location */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocationOn color="primary" />
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                    Location
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
                  {event.location}
                </Typography>
              </Box>

              {/* Description */}
              <Box>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
                  About This Event
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                  {event.description}
                </Typography>
              </Box>


              {/* Add to Cart Section */}
              <Box 
                sx={{ 
                  bgcolor: 'grey.50', 
                  p: 3, 
                  borderRadius: 2,
                  textAlign: 'center'
                }}
              >
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Ready to Attend?
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Price: {event.price}
                </Typography>
                
                {User.isAuthenticated && User.user ? (
                  <Button
                    variant="contained"
                    color="error"
                    size="large"
                    startIcon={<ShoppingCart />}
                    onClick={handleAddToCart}
                    sx={{ 
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      textTransform: 'none',
                      fontWeight: 'medium'
                    }}
                  >
                    Add to Cart
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<LoginIcon />}
                    onClick={() => setAuthDialogOpen(true)}
                    sx={{ 
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      textTransform: 'none',
                      fontWeight: 'medium'
                    }}
                  >
                    Login to Add to Cart
                  </Button>
                )}
              </Box>
            </Stack>
          </Box>
        </Paper>
      </Container>

      {/* Authentication Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        onSubmit={handleLogin}
        onRegister={handleRegister}
        error={loginError}
      />
    </Box>
  );
}