'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Button, CircularProgress, Alert, Box, Container, Card, CardMedia, Chip, Stack, Paper, AppBar, Toolbar, Avatar, Menu, MenuItem, Divider} from '@mui/material';
import { LocationOn, Event as EventIcon, AccessTime, ShoppingCart, ArrowBack, Login as LoginIcon, Bookmark, BookmarkBorder, Person, Logout, AdminPanelSettings, Cancel, Warning, Info} from '@mui/icons-material';
import { useSearchParams, useRouter } from 'next/navigation';
import { Event } from '@/types';
import { useUser } from '@/context/UserContext';
import { useCart } from '@/context/CartContext';
import { AuthDialog } from '@/components/AuthDialog';
import { dayjs, Dayjs, Chronos } from '@jstiava/chronos';
new Chronos;

export default function EventDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams?.get('id');
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const User = useUser();
  const Cart = useCart();

  const parseEventStatus = (title: string) => {
    const statusPatterns = [
      /^\*CANCELLED\*/i,
      /^\*CANCELED\*/i,
      /^\*SOLD OUT\*/i,
      /^\*POSTPONED\*/i,
      /^\*RESCHEDULED\*/i,
      /^\*MOVED\*/i,
      /^\*DELAYED\*/i
    ];

    for (const pattern of statusPatterns) {
      const match = title.match(pattern);
      if (match) {
        const status = match[0].replace(/\*/g, '').toUpperCase();
        const cleanTitle = title.replace(pattern, '').trim();
        return { status, cleanTitle, hasStatus: true };
      }
    }

    return { status: null, cleanTitle: title, hasStatus: false };
  };

  const eventStatusInfo = event ? parseEventStatus(event.title) : { status: null, cleanTitle: '', hasStatus: false };
  const canAddToCart = !eventStatusInfo.hasStatus || 
    (eventStatusInfo.status !== 'CANCELLED' && 
     eventStatusInfo.status !== 'CANCELED' && 
     eventStatusInfo.status !== 'SOLD OUT');

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
    
    if (eventId) {
      fetchEventDetails(eventId);
    } else {
      setError('No event ID provided');
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (User.user && event) {
      const savedEvents = User.user.savedEvents || [];
      setIsSaved(savedEvents.some((savedEvent: any) => savedEvent.eventId === event.id));
    }
  }, [User.user, event]);

  const fetchEventDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching event details for ID:', id);
            let response = await fetch(`/api/events/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      let data;
      
      if (!response.ok) {
        console.log('Specific endpoint failed, searching all events...');
        response = await fetch('/api/events?refresh=true&targetCount=200&maxPages=10&page=0');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.status}`);
        }
        
        data = await response.json();
        const foundEvent = data.events.find((e: Event) => e.id === id);
        
        if (!foundEvent) {
          throw new Error('Event not found');
        }
        
        setEvent(foundEvent);
      } else {
        data = await response.json();
        
        if (!data.event) {
          throw new Error('Event data not found in response');
        }
        
        setEvent(data.event);
      }
      
    } catch (err) {
      console.error('Error loading event details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load event details. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (dateString: string) => {
    if (!dateString || dateString === 'TBA') return 'TBA';
    
    try {
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
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const formatEventTime = (timeString: string) => {
    if (timeString === 'TBA' || !timeString) {
      return 'TBA';
    }
    
    const cleanTime = timeString.trim();
    
    // If already formatted with AM/PM, return as is
    if (cleanTime.toLowerCase().includes('am') || cleanTime.toLowerCase().includes('pm')) {
      return cleanTime;
    }
    
    // Handle HH:MM:SS or HH:MM format
    if (cleanTime.includes(':')) {
      const timeParts = cleanTime.split(':');
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      
      if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const displayMinutes = minutes.toString().padStart(2, '0');
        return `${displayHours}:${displayMinutes} ${period}`;
      }
    }
    
    // Handle HHMM format
    if (/^\d{4}$/.test(cleanTime)) {
      const hours = parseInt(cleanTime.substring(0, 2), 10);
      const minutes = parseInt(cleanTime.substring(2, 4), 10);
      
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const displayMinutes = minutes.toString().padStart(2, '0');
        return `${displayHours}:${displayMinutes} ${period}`;
      }
    }
    
    // Handle HMM format (e.g., 930 for 9:30)
    if (/^\d{3}$/.test(cleanTime)) {
      const hours = parseInt(cleanTime.substring(0, 1), 10);
      const minutes = parseInt(cleanTime.substring(1, 3), 10);
      
      if (hours >= 0 && hours <= 9 && minutes >= 0 && minutes <= 59) {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours;
        const displayMinutes = minutes.toString().padStart(2, '0');
        return `${displayHours}:${displayMinutes} ${period}`;
      }
    }
    
    return cleanTime;
  };

  const handleSaveEvent = async () => {
    if (!User.isAuthenticated || !User.user) {
      setAuthDialogOpen(true);
      return;
    }

    if (!event) return;

    setSaveLoading(true);
    
    try {
      const response = await fetch('/api/me/saved-events', {
        method: isSaved ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: eventStatusInfo.cleanTitle 
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isSaved ? 'remove' : 'save'} event`);
      }

      setIsSaved(!isSaved);
      await User.checkAuth();
      
    } catch (error) {
      console.error('Error saving event:', error);
      alert(`Failed to ${isSaved ? 'remove' : 'save'} event. Please try again.`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!User.isAuthenticated || !User.user) {
      setAuthDialogOpen(true);
      return;
    }
    
    if (!canAddToCart) {
      alert(`This event is ${eventStatusInfo.status?.toLowerCase()} and cannot be added to cart.`);
      return;
    }
    
    if (event) {
      Cart.addToCart(event);
      alert(`${eventStatusInfo.cleanTitle} added to cart!`);
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

  const handleProfileClick = () => {
    handleProfileMenuClose();
    window.location.href = '/profile';
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

  const getStatusChipProps = () => {
    if (!eventStatusInfo.hasStatus) return null;

    const status = eventStatusInfo.status;
    let chipColor: 'error' | 'warning' | 'info' = 'error';
    let icon = null;

    switch (status) {
      case 'CANCELLED':
      case 'CANCELED':
        chipColor = 'error';
        icon = <Cancel />;
        break;
      case 'SOLD OUT':
        chipColor = 'warning';
        icon = <Warning />;
        break;
      case 'POSTPONED':
      case 'RESCHEDULED':
      case 'MOVED':
      case 'DELAYED':
        chipColor = 'info';
        icon = <Info />;
        break;
    }

    return { color: chipColor, icon, label: status };
  };

  const statusChipProps = getStatusChipProps();

  if (loading) {
    return (
      <Box>
        {/* Header */}
        <AppBar position="static" sx={{ mb: 4 }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              Chivent
            </Typography>
            
            {authLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : User.user ? (
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
                  <MenuItem onClick={handleProfileClick}>
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
            
            {authLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : User.user ? (
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
          
          <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h6" component="div" sx={{ mb: 1 }}>
              {error?.includes('not found') ? 'Event Not Found' : 'Error Loading Event'}
            </Typography>
            <Typography variant="body2">
              {error || 'The requested event could not be found.'}
            </Typography>
            {error?.includes('Failed to fetch') && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                Please check that your server is running and the database is accessible.
              </Typography>
            )}
          </Alert>
          
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant="contained"
              onClick={() => fetchEventDetails(eventId || '')}
              disabled={!eventId}
            >
              Retry
            </Button>
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
          
          {authLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : User.user ? (
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
                <MenuItem onClick={handleProfileClick}>
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

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/')}
          sx={{ mb: 3 }}
        >
          Back to Events
        </Button>

        <Paper elevation={3} sx={{ overflow: 'hidden' }}>
          {/* Image Section */}
          <Box sx={{ position: 'relative', height: 400 }}>
            <CardMedia
              component="img"
              height="400"
              image={event.image}
              alt={eventStatusInfo.cleanTitle}
              onError={(e) => { 
                e.currentTarget.src = "https://via.placeholder.com/800x400?text=Event+Image";
              }}
              sx={{ 
                objectFit: 'cover',
                ...(eventStatusInfo.hasStatus && (eventStatusInfo.status === 'CANCELLED' || eventStatusInfo.status === 'CANCELED' || eventStatusInfo.status === 'SOLD OUT') && {
                  filter: 'grayscale(30%) brightness(0.8)'
                })
              }}
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography 
                    variant="h3" 
                    component="h1" 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold', 
                      mb: 1,
                      // Add strikethrough for cancelled events
                      ...(eventStatusInfo.hasStatus && (eventStatusInfo.status === 'CANCELLED' || eventStatusInfo.status === 'CANCELED') && {
                        textDecoration: 'line-through',
                        opacity: 0.8
                      })
                    }}
                  >
                    {eventStatusInfo.cleanTitle}
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
                
                {/* Show status chip or price chip */}
                {statusChipProps ? (
                  <Chip
                    //icon={statusChipProps.icon}
                    label={statusChipProps.label}
                    color={statusChipProps.color}
                    sx={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: 'white',
                      px: 2,
                      py: 1,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                  />
                ) : (
                  <Chip
                    label={event.price}
                    color="error"
                    sx={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: 'white',
                      px: 2,
                      py: 1
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Event Details Section */}
          <Box sx={{ p: 4 }}>
            <Stack spacing={4}>
              {/* Status Alert for cancelled/sold out events */}
              {eventStatusInfo.hasStatus && (eventStatusInfo.status === 'CANCELLED' || eventStatusInfo.status === 'CANCELED' || eventStatusInfo.status === 'SOLD OUT') && (
                <Alert 
                  severity={eventStatusInfo.status === 'SOLD OUT' ? 'warning' : 'error'}
                  sx={{ fontSize: '1.1rem' }}
                >
                  <Typography variant="h6" component="div">
                    Event {eventStatusInfo.status}
                  </Typography>
                  <Typography variant="body2">
                    {eventStatusInfo.status === 'SOLD OUT' 
                      ? 'This event is sold out and no longer available for purchase.'
                      : 'This event has been cancelled and is no longer available.'}
                  </Typography>
                </Alert>
              )}

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

              {/* Action Buttons Section */}
              <Box 
                sx={{ 
                  bgcolor: 'grey.50', 
                  p: 3, 
                  borderRadius: 2,
                  textAlign: 'center'
                }}
              >
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                  {canAddToCart ? 'Ready to Attend?' : 'Event Status'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {eventStatusInfo.hasStatus ? `Status: ${eventStatusInfo.status}` : `Price: ${event.price}`}
                </Typography>
                
                {User.isAuthenticated && User.user ? (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                    {canAddToCart ? (
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
                        color="inherit"
                        size="large"
                        disabled
                        sx={{ 
                          px: 4,
                          py: 1.5,
                          fontSize: '1.1rem',
                          textTransform: 'none',
                          fontWeight: 'medium',
                          bgcolor: 'grey.300',
                          color: 'grey.600'
                        }}
                      >
                        Cannot Add to Cart - {eventStatusInfo.status}
                      </Button>
                    )}
                    
                    <Button
                      variant={isSaved ? "contained" : "outlined"}
                      color="primary"
                      size="large"
                      startIcon={saveLoading ? <CircularProgress size={20} color="inherit" /> : (isSaved ? <Bookmark /> : <BookmarkBorder />)}
                      onClick={handleSaveEvent}
                      disabled={saveLoading}
                      sx={{ 
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        textTransform: 'none',
                        fontWeight: 'medium',
                        bgcolor: isSaved ? '#FFD700' : undefined,
                        color: isSaved ? '#B8860B' : undefined,
                        '&:hover': {
                          bgcolor: isSaved ? '#FFC107' : undefined,
                        }
                      }}
                    >
                      {isSaved ? 'Saved' : 'Save Event'}
                    </Button>
                  </Stack>
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
                    Login to {canAddToCart ? 'Add to Cart' : 'Save Event'}
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