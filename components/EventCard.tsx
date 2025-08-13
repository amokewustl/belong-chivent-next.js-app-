'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardMedia, CardActions, Typography, Button, Chip, Box, Stack, IconButton, Tooltip } from '@mui/material';
import {
  LocationOn, Event as EventIcon, AccessTime, Visibility, Bookmark, BookmarkBorder
} from '@mui/icons-material';
import { Event } from '@/types';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { dayjs, Dayjs, Chronos } from '@jstiava/chronos';
new Chronos;

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const router = useRouter();
  const User = useUser();
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

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

  useEffect(() => {
    console.log('Checking if event is saved (initial load):', {
      eventId: event.id,
      userExists: !!User.user,
      savedEventsCount: User.user?.savedEvents?.length || 0
    });
    
    if (User.user && event) {
      const savedEvents = User.user.savedEvents || [];
      const isEventSaved = savedEvents.some((savedEvent: any) => {
        console.log('Comparing:', savedEvent.eventId, 'with', event.id);
        return savedEvent.eventId === event.id;
      });
      
      console.log('Event saved status from server:', isEventSaved);
      
      // Only update if we don't already have a saved state or if not currently in a loading state
      if (!saveLoading) {
        setIsSaved(isEventSaved);
      }
    } else if (!User.user) {
      setIsSaved(false);
    }
  }, [User.user?.savedEvents?.length, event.id]); 

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
      // Within a week from now
      return eventDate.format('dddd, MMMM D');
    } else {
      // Use full date format MM/DD/YYYY with day of week
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

  const handleViewDetails = () => {
    router.push(`/event-details?id=${event.id}`);
  };

  const handleSaveEvent = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    
    if (!User.isAuthenticated || !User.user) {
      alert('Please log in to save events');
      return;
    }

    setSaveLoading(true);
    const previousSavedState = isSaved;
    
    try {
      console.log('=== Save Event Action ===');
      console.log('Current isSaved state:', isSaved);
      console.log('Event details:', { 
        id: event.id, 
        title: cleanTitle, 
        action: isSaved ? 'REMOVE' : 'SAVE'
      });
      
      const newSavedState = !isSaved;
      setIsSaved(newSavedState);
      
      const response = await fetch('/api/me/saved-events', {
        method: isSaved ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: cleanTitle 
        })
      });

      const responseData = await response.json();
      console.log('API Response:', responseData);

      if (!response.ok) {
        setIsSaved(previousSavedState);
        throw new Error(responseData.error || `Failed to ${previousSavedState ? 'remove' : 'save'} event`);
      }

      const action = newSavedState ? 'saved' : 'removed from saved events';
      const eventTitle = cleanTitle.length > 50 ? cleanTitle.substring(0, 50) + '...' : cleanTitle;
      alert(`✓ "${eventTitle}" has been ${action}!`);
      
      
      setTimeout(() => {
        User.checkAuth();
      }, 2000); 
      
    } catch (error) {
      console.error('Error saving event:', error);
      setIsSaved(previousSavedState);
      const action = previousSavedState ? 'remove' : 'save';
      alert(`Failed to ${action} event. Please try again.`);
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
          image={event.image}
          alt={cleanTitle}
          onError={(e) => { 
            e.currentTarget.src = "https://via.placeholder.com/400x300?text=Event+Image";
          }}
          sx={{
            objectFit: 'cover'
          }}
        />
        <Chip
          {...chipProps}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            fontWeight: chipProps.fontWeight,
            // Special styling for status chips
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
                bgcolor: isSaved ? '#FFEB3B' : 'rgba(255, 255, 255, 0.9)', 
                color: isSaved ? '#F57C00' : 'rgba(0, 0, 0, 0.7)', 
                border: isSaved ? '2px solid #FFC107' : '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: isSaved 
                  ? '0 0 20px rgba(255, 193, 7, 0.6), 0 4px 8px rgba(255, 193, 7, 0.3)' 
                  : '0 2px 4px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  bgcolor: isSaved ? '#FDD835' : 'rgba(255, 255, 255, 1)',
                  transform: 'scale(1.1)',
                  boxShadow: isSaved 
                    ? '0 0 25px rgba(255, 193, 7, 0.8), 0 6px 12px rgba(255, 193, 7, 0.4)' 
                    : '0 4px 8px rgba(0, 0, 0, 0.15)',
                },
                '&:disabled': {
                  bgcolor: isSaved ? '#FFF176' : 'rgba(255, 255, 255, 0.7)',
                  color: isSaved ? '#F57C00' : 'rgba(0, 0, 0, 0.4)',
                  opacity: 0.8,
                },
                transition: 'all 0.3s ease-in-out',
                width: 40,
                height: 40,
              }}
              size="small"
            >
              {saveLoading ? (
                <div style={{ 
                  width: 18, 
                  height: 18, 
                  border: '3px solid currentColor', 
                  borderTop: '3px solid transparent', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite' 
                }} />
              ) : isSaved ? (
                <Bookmark fontSize="medium" sx={{ color: '#E65100', fontWeight: 'bold' }} />
              ) : (
                <BookmarkBorder fontSize="medium" />
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
            // Add strikethrough for cancelled events
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

      {/* spin animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Card>
  );
};