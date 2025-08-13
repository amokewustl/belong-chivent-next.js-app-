'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, TextField, Button, Avatar, Chip, Switch, FormControlLabel, Alert, Divider, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, AppBar, Toolbar, Container, Paper, Stack, Fade, Collapse, ButtonBase, Tooltip} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon, Person as PersonIcon, Email as EmailIcon, Phone as PhoneIcon, LocationOn as LocationIcon,
  Cake as CakeIcon, Settings as SettingsIcon, History as HistoryIcon, Bookmark as BookmarkIcon, Add as AddIcon, Close as CloseIcon, Home as HomeIcon, Event as EventIcon, Delete as DeleteIcon} from '@mui/icons-material';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

interface UserFormData {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  profile: {
    bio: string;
    interests: string[];
    location: string;
  };
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    eventReminders: boolean;
    newsletter: boolean;
  };
}

interface EventHistoryItem {
  eventId: string;
  eventTitle: string;
  ticketType: string;
  ticketPrice: number;
  purchaseDate: string;
  attendedDate?: string;
  rating?: number;
  review?: string;
}

interface SavedEventItem {
  eventId: string;
  eventTitle?: string;
  savedAt: string;
}

export default function UserProfilePage() {
  const { user, checkAuth } = useUser();
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [unsaveLoading, setUnsaveLoading] = useState<string | null>(null);

  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    profile: {
      bio: '',
      interests: [],
      location: ''
    },
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      eventReminders: true,
      newsletter: true
    }
  });

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || 'USA'
        },
        profile: {
          bio: user.profile?.bio || '',
          interests: user.profile?.interests || [],
          location: user.profile?.location || ''
        },
        preferences: {
          emailNotifications: user.preferences?.emailNotifications ?? true,
          smsNotifications: user.preferences?.smsNotifications ?? false,
          eventReminders: user.preferences?.eventReminders ?? true,
          newsletter: user.preferences?.newsletter ?? true
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleInputChange = (field: string, value: any) => {
    const keys = field.split('.');
    if (keys.length === 2) {
      const [parent, child] = keys;
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof UserFormData] as object),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !formData.profile.interests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          interests: [...prev.profile.interests, newInterest.trim()]
        }
      }));
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interestToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        interests: prev.profile.interests.filter(interest => interest !== interestToRemove)
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      
      // Refresh user data
      await checkAuth();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || 'USA'
        },
        profile: {
          bio: user.profile?.bio || '',
          interests: user.profile?.interests || [],
          location: user.profile?.location || ''
        },
        preferences: {
          emailNotifications: user.preferences?.emailNotifications ?? true,
          smsNotifications: user.preferences?.smsNotifications ?? false,
          eventReminders: user.preferences?.eventReminders ?? true,
          newsletter: user.preferences?.newsletter ?? true
        }
      });
    }
    setEditMode(false);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/me/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ preferences: formData.preferences })
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      setSuccess('Notification preferences updated!');
      setSettingsOpen(false);
      await checkAuth();
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSavedEventClick = (eventId: string) => {
    router.push(`/event-details?id=${eventId}`);
  };

  const handleUnsaveEvent = async (eventId: string, eventTitle: string) => {
    setUnsaveLoading(eventId);
    
    try {
      const response = await fetch('/api/me/saved-events', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          eventId: eventId,
          eventTitle: eventTitle
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove saved event');
      }

      setSuccess('Event removed from saved events!');
      
      // Refresh user data to update the saved events list
      await checkAuth();
      
    } catch (error) {
      console.error('Error removing saved event:', error);
      setError('Failed to remove saved event. Please try again.');
    } finally {
      setUnsaveLoading(null);
    }
  };

  const getUserInitial = () => {
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    return user?.username?.charAt(0).toUpperCase() || 'U';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Please log in to view your profile.
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => window.location.href = '/'}
          >
            Go to Home
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" sx={{ mb: 4 }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => window.location.href = '/'}
            sx={{ mr: 2 }}
          >
            <HomeIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            My Profile
          </Typography>
          
          <Stack direction="row" spacing={1}>
            {!editMode ? (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={loading}
                  sx={{ textTransform: 'none' }}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={loading}
                  sx={{ textTransform: 'none' }}
                >
                  Cancel
                </Button>
              </>
            )}
            
            <IconButton
              color="inherit"
              onClick={() => setSettingsOpen(true)}
            >
              <SettingsIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 } }}>
        {/* Alerts */}
        <Collapse in={!!success}>
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        </Collapse>
        
        <Collapse in={!!error}>
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        </Collapse>

        {/* Main Content in Flex Layout */}
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
          {/* Left Column - Main Profile Info */}
          <Box sx={{ flex: 1, maxWidth: { lg: '65%' } }}>
            {/* Basic Information Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mr: { xs: 0, sm: 3 },
                      mb: { xs: 2, sm: 0 },
                      bgcolor: 'primary.main',
                      fontSize: '2rem'
                    }}
                  >
                    {getUserInitial()}
                  </Avatar>
                  <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                      {user.firstName} {user.lastName}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, mb: 1 }}>
                      <EmailIcon sx={{ mr: 1, fontSize: '1rem' }} />
                      {user.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{user.username} • Member since {formatDate(user.createdAt)}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ flex: '1 1 300px', minWidth: 250 }}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!editMode}
                      sx={{ mb: 2 }}
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 300px', minWidth: 250 }}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!editMode}
                      sx={{ mb: 2 }}
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 300px', minWidth: 250 }}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!editMode}
                      placeholder="Enter your phone number"
                      sx={{ mb: 2 }}
                      InputProps={{
                        startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 300px', minWidth: 250 }}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      disabled={!editMode}
                      InputLabelProps={{ shrink: true }}
                      sx={{ mb: 2 }}
                      InputProps={{
                        startAdornment: <CakeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                      helperText={formData.dateOfBirth ? `Age: ${calculateAge(formData.dateOfBirth)}` : ''}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Address Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                  <LocationIcon sx={{ mr: 1 }} />
                  Address Information
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    disabled={!editMode}
                    placeholder="Enter your street address"
                  />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <TextField
                      label="City"
                      value={formData.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                      disabled={!editMode}
                      placeholder="City"
                      sx={{ flex: '2 1 200px', minWidth: 150 }}
                    />
                    <TextField
                      label="State"
                      value={formData.address.state}
                      onChange={(e) => handleInputChange('address.state', e.target.value)}
                      disabled={!editMode}
                      placeholder="State"
                      sx={{ flex: '1 1 100px', minWidth: 100 }}
                    />
                    <TextField
                      label="ZIP Code"
                      value={formData.address.zipCode}
                      onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                      disabled={!editMode}
                      placeholder="ZIP"
                      sx={{ flex: '1 1 100px', minWidth: 100 }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Bio and Interests Card */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary.main">
                  About Me
                </Typography>
                
                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  rows={4}
                  value={formData.profile.bio}
                  onChange={(e) => handleInputChange('profile.bio', e.target.value)}
                  disabled={!editMode}
                  placeholder="Tell us about yourself..."
                  sx={{ mb: 3 }}
                />

                <Typography variant="subtitle1" gutterBottom>
                  Interests
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {formData.profile.interests.map((interest, index) => (
                    <Chip
                      key={index}
                      label={interest}
                      onDelete={editMode ? () => handleRemoveInterest(interest) : undefined}
                      variant="outlined"
                      color="primary"
                      deleteIcon={<CloseIcon />}
                    />
                  ))}
                </Box>

                <Fade in={editMode}>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <TextField
                      size="small"
                      placeholder="Add new interest"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                      sx={{ flexGrow: 1 }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleAddInterest}
                      disabled={!newInterest.trim()}
                    >
                      Add
                    </Button>
                  </Box>
                </Fade>
              </CardContent>
            </Card>
          </Box>

          {/* Right Column - Stats and Activity */}
          <Box sx={{ flex: '0 0 350px', minWidth: 300 }}>
            {/* Quick Stats Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary.main">
                  Activity Summary
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50', flex: 1 }}>
                    <Typography variant="h3" color="primary.main">
                      {user.eventHistory?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Events Attended
                    </Typography>
                  </Paper>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.50', flex: 1 }}>
                    <Typography variant="h3" color="secondary.main">
                      {user.savedEvents?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Saved Events
                    </Typography>
                  </Paper>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Last login: {formatDate(user.lastLogin || '')}
                </Typography>
              </CardContent>
            </Card>

            {/* Recent Event History */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                  <HistoryIcon sx={{ mr: 1 }} />
                  Recent Events
                </Typography>
                
                {user.eventHistory && user.eventHistory.length > 0 ? (
                  <Stack spacing={2}>
                    {user.eventHistory.slice(0, 3).map((event: EventHistoryItem, index) => (
                      <ButtonBase
                        key={index}
                        onClick={() => handleSavedEventClick(event.eventId)}
                        sx={{ 
                          width: '100%',
                          textAlign: 'left',
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          }
                        }}
                      >
                        <Paper elevation={1} sx={{ p: 2, width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <EventIcon fontSize="small" color="primary" />
                            <Typography variant="subtitle2" fontWeight="medium">
                              {event.eventTitle}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {event.ticketType} • ${event.ticketPrice} • {formatDate(event.purchaseDate)}
                          </Typography>
                        </Paper>
                      </ButtonBase>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No events attended yet
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Saved Events */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                  <BookmarkIcon sx={{ mr: 1 }} />
                  Saved Events
                </Typography>
                
                {user.savedEvents && user.savedEvents.length > 0 ? (
                  <Stack spacing={2}>
                    {user.savedEvents.slice(0, 5).map((event: SavedEventItem, index) => (
                      <Paper 
                        key={index}
                        elevation={1} 
                        sx={{ 
                          p: 2, 
                          width: '100%',
                          '&:hover': {
                            boxShadow: 2
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <ButtonBase
                            onClick={() => handleSavedEventClick(event.eventId)}
                            sx={{ 
                              flex: 1,
                              textAlign: 'left',
                              borderRadius: 1,
                              '&:hover': {
                                backgroundColor: 'action.hover',
                                transform: 'translateY(-1px)',
                              },
                              transition: 'all 0.2s ease-in-out'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <BookmarkIcon fontSize="small" sx={{ color: '#FFD700' }} />
                              <Typography variant="subtitle2" fontWeight="medium">
                                {event.eventTitle || 'Saved Event'}
                              </Typography>
                            </Box>
                          </ButtonBase>
                          
                          <Tooltip title="Remove from saved events">
                            <IconButton
                              size="small"
                              onClick={() => handleUnsaveEvent(event.eventId, event.eventTitle || 'Event')}
                              disabled={unsaveLoading === event.eventId}
                              sx={{ 
                                ml: 1,
                                color: 'error.main',
                                '&:hover': {
                                  bgcolor: 'error.light',
                                  color: 'error.dark'
                                }
                              }}
                            >
                              {unsaveLoading === event.eventId ? (
                                <div style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <div style={{ 
                                    width: 12, 
                                    height: 12, 
                                    border: '2px solid currentColor', 
                                    borderTop: '2px solid transparent', 
                                    borderRadius: '50%', 
                                    animation: 'spin 1s linear infinite' 
                                  }} />
                                </div>
                              ) : (
                                <DeleteIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Saved {formatDate(event.savedAt)}
                        </Typography>
                      </Paper>
                    ))}
                    {user.savedEvents.length > 5 && (
                      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', pt: 1 }}>
                        and {user.savedEvents.length - 5} more saved events...
                      </Typography>
                    )}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No saved events yet
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notification Preferences</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.preferences.emailNotifications}
                  onChange={(e) => handleInputChange('preferences.emailNotifications', e.target.checked)}
                />
              }
              label="Email Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.preferences.smsNotifications}
                  onChange={(e) => handleInputChange('preferences.smsNotifications', e.target.checked)}
                />
              }
              label="SMS Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.preferences.eventReminders}
                  onChange={(e) => handleInputChange('preferences.eventReminders', e.target.checked)}
                />
              }
              label="Event Reminders"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.preferences.newsletter}
                  onChange={(e) => handleInputChange('preferences.newsletter', e.target.checked)}
                />
              }
              label="Newsletter"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveSettings} variant="contained" disabled={loading}>
            Save Preferences
          </Button>
        </DialogActions>
      </Dialog>

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}