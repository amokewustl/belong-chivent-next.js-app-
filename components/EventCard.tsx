import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardMedia, CardActions, Typography, Button, Chip, Box, Stack, IconButton, Tooltip, Alert, Snackbar } from '@mui/material';
import {
  LocationOn, Event as EventIcon, AccessTime, Visibility, Bookmark, BookmarkBorder
} from '@mui/icons-material';
import { useRouter } from 'next/navigation'; 
import { useUser } from '@/context/UserContext'; 

interface Event {
  id: string;
  title: string;
  description: string;
  image: string;
  price: string;
  price_value: number;
  location: string;
  startDate: string;
  startTime: string;
  url: string;
}

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const router = useRouter(); 
  const User = useUser(); 
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');

  
  useEffect(() => {
    if (User.user?.savedEvents) {
      const isEventSaved = User.user.savedEvents.some(
        (savedEvent: any) => savedEvent.eventId === event.id
      );
      setIsSaved(isEventSaved);
    } else {
      setIsSaved(false);
    }
  }, [User.user?.savedEvents, event.id]);

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

  const { status, cleanTitle, hasStatus } = parseEventStatus(event.title);

  const showSaveAlert = (message: string, severity: 'success' | 'error' = 'success') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setShowAlert(true);
  };

  const formatEventDate = (dateString: string) => {
    if (!dateString || dateString === 'TBA') return 'TBA';
    
    try {
      const eventDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      eventDate.setHours(0, 0, 0, 0);
      
      const diffTime = eventDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays === -1) return 'Yesterday';
      
      return eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatEventTime = (timeString: string) => {
    if (timeString === 'TBA' || !timeString) return 'TBA';
    
    // If already formatted with AM/PM, return as is
    if (timeString.toLowerCase().includes('am') || timeString.toLowerCase().includes('pm')) {
      return timeString;
    }
    
    // Handle HH:MM format
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
    }
    
    return timeString;
  };

  const handleViewDetails = () => {
    router.push(`/event-details?id=${event.id}`);
  };

  const handleSaveEvent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!User.isAuthenticated || !User.user) {
      showSaveAlert('Please log in to save events', 'error');
      return;
    }

    setSaveLoading(true);
    const previousSavedState = isSaved;
    const newSavedState = !isSaved;
    
    setIsSaved(newSavedState);
    
    try {
      const endpoint = '/api/me/saved-events';
      const method = previousSavedState ? 'DELETE' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: cleanTitle
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${previousSavedState ? 'unsave' : 'save'} event`);
      }

      const action = newSavedState ? 'saved to your events' : 'removed from saved events';
      const eventTitle = cleanTitle.length > 40 ? cleanTitle.substring(0, 40) + '...' : cleanTitle;
      showSaveAlert(`"${eventTitle}" has been ${action}!`, 'success');
      
      setTimeout(() => {
        User.checkAuth();
      }, 500);
      
    } catch (error) {
      console.error('Error saving/unsaving event:', error);
      setIsSaved(previousSavedState);
      const action = newSavedState ? 'save' : 'remove';
      showSaveAlert(`Failed to ${action} event. ${error instanceof Error ? error.message : 'Please try again.'}`, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const formattedDate = formatEventDate(event.startDate);
  const formattedTime = formatEventTime(event.startTime);

  const getChipProps = () => {
    if (hasStatus) {
      const chipColor = status === 'CANCELLED' || status === 'CANCELED' ? 'error' :
                       status === 'SOLD OUT' ? 'warning' :
                       status === 'POSTPONED' || status === 'RESCHEDULED' ? 'info' :
                       'default';
      
      return {
        label: status,
        color: chipColor as 'error' | 'warning' | 'info' | 'default',
        fontWeight: 'bold'
      };
    } else {
      return {
        label: event.price || `$${event.price_value || 0}`,
        color: 'error' as const,
        fontWeight: 'bold'
      };
    }
  };

  const chipProps = getChipProps();

  return (
    <>
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: (theme) => theme.shadows[8],
          },
          ...(hasStatus && (status === 'CANCELLED' || status === 'CANCELED' || status === 'SOLD OUT') && {
            opacity: 0.8,
            filter: 'grayscale(20%)'
          })
        }}
        elevation={2}
      >
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="200"
            image={event.image || "https://via.placeholder.com/400x300?text=Event+Image"}
            alt={cleanTitle}
            sx={{ objectFit: 'cover' }}
          />
          
          {/* Price/Status Chip */}
          <Chip
            {...chipProps}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'white',
              fontWeight: chipProps.fontWeight,
              ...(hasStatus && {
                fontSize: '0.75rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              })
            }}
          />
          
          {/* Save Button */}
          {User.isAuthenticated && User.user && (
            <Tooltip title={isSaved ? 'Remove from saved events' : 'Save event'}>
              <IconButton
                onClick={handleSaveEvent}
                disabled={saveLoading}
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  width: 42,
                  height: 42,
                 
                  bgcolor: isSaved 
                    ? 'rgba(255, 235, 59, 0.95)' 
                    : 'rgba(255, 255, 255, 0.9)', 
                  color: isSaved 
                    ? '#E65100' 
                    : 'rgba(0, 0, 0, 0.7)', 
                  border: isSaved 
                    ? '2px solid #FF9800' 
                    : '2px solid rgba(255, 255, 255, 0.8)', 

                  boxShadow: isSaved 
                    ? '0 0 20px rgba(255, 152, 0, 0.6), 0 4px 12px rgba(255, 152, 0, 0.4), inset 0 0 10px rgba(255, 193, 7, 0.3)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.15)',
                  
                  '&:hover': {
                    transform: 'scale(1.1)',
                    bgcolor: isSaved 
                      ? 'rgba(255, 221, 51, 1)' 
                      : 'rgba(255, 255, 255, 1)', 
                    boxShadow: isSaved 
                      ? '0 0 25px rgba(255, 152, 0, 0.8), 0 6px 16px rgba(255, 152, 0, 0.5), inset 0 0 15px rgba(255, 193, 7, 0.4)' 
                      : '0 4px 12px rgba(0, 0, 0, 0.2)',
                    // Pulse animation for saved state
                    ...(isSaved && {
                      animation: 'pulse 0.6s ease-in-out'
                    })
                  },
                  
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                  
                  '&:disabled': {
                    bgcolor: isSaved 
                      ? 'rgba(255, 235, 59, 0.7)' 
                      : 'rgba(255, 255, 255, 0.6)',
                    opacity: 0.8,
                  },
                  
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  
                  // Additional glow effect for saved state
                  ...(isSaved && {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -2,
                      left: -2,
                      right: -2,
                      bottom: -2,
                      borderRadius: '50%',
                      background: 'linear-gradient(45deg, #FFD700, #FF8F00, #FFD700)',
                      zIndex: -1,
                      opacity: 0.3,
                      filter: 'blur(4px)',
                    }
                  })
                }}
                size="small"
              >
                {saveLoading ? (
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      border: '3px solid currentColor',
                      borderTop: '3px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                ) : isSaved ? (
                  <Bookmark 
                    fontSize="medium" 
                    sx={{ 
                      color: '#D84315',
                      filter: 'drop-shadow(0 2px 4px rgba(216, 67, 21, 0.3))',
                      fontSize: '1.4rem'
                    }} 
                  />
                ) : (
                  <BookmarkBorder 
                    fontSize="medium" 
                    sx={{ 
                      fontSize: '1.4rem',
                      transition: 'all 0.2s ease'
                    }} 
                  />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          <Typography 
            variant="h6" 
            component="h3" 
            gutterBottom 
            sx={{
              fontWeight: 'bold',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.6em',
              ...(hasStatus && (status === 'CANCELLED' || status === 'CANCELED') && {
                textDecoration: 'line-through',
                color: 'text.secondary'
              })
            }}
          >
            {cleanTitle}
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '3.6em'
            }}
          >
            {event.description}
          </Typography>

          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn fontSize="small" color="action" />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {event.location}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {formattedDate}
              </Typography>
              {formattedTime !== 'TBA' && (
                <>
                  <AccessTime fontSize="small" color="action" sx={{ ml: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {formattedTime}
                  </Typography>
                </>
              )}
            </Box>
          </Stack>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Visibility />}
            onClick={handleViewDetails}
            fullWidth
            sx={{ 
              textTransform: 'none',
              fontWeight: 'medium',
              py: 1
            }}
          >
            View Details
          </Button>
        </CardActions>

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}</style>
      </Card>

      {/* Enhanced Alert/Snackbar */}
      <Snackbar
        open={showAlert}
        autoHideDuration={4000}
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            minWidth: '300px'
          }
        }}
      >
        <Alert 
          onClose={() => setShowAlert(false)} 
          severity={alertSeverity}
          sx={{
            width: '100%',
            fontSize: '0.95rem',
            '& .MuiAlert-message': {
              fontWeight: 500
            },
            ...(alertSeverity === 'success' && {
              bgcolor: 'success.light',
              color: 'success.contrastText',
              '& .MuiAlert-icon': {
                color: 'success.main'
              }
            })
          }}
          elevation={6}
          variant="filled"
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </>
  );
};