'use client';

import React from 'react';
import { Card, CardContent, CardMedia, CardActions, Typography, Button, Chip, Box, Stack, IconButton, Tooltip} from '@mui/material';
import {
  LocationOn, Event as EventIcon, AccessTime, ShoppingCart, Visibility, Login
} from '@mui/icons-material';
import { Event } from '@/types';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import { dayjs, Dayjs, Chronos } from '@jstiava/chronos';
new Chronos;

interface EventCardProps {
  event: Event;
  onAuthRequired?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onAuthRequired }) => {
  const Cart = useCart();
  const { user, isAuthenticated } = useUser();

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
    const formattedDate = formatEventDate(event.startDate);
    const formattedTime = formatEventTime(event.startTime);
    
    alert(`Event: ${event.title}\n\nDescription: ${event.description}\n\nLocation: ${event.location}\n\nDate: ${formattedDate}\nTime: ${formattedTime}`);
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      // Show auth dialog if user is not logged in
      if (onAuthRequired) {
        onAuthRequired();
      } else {
        alert('Please log in to add items to your cart');
      }
      return;
    }
    
    Cart.addToCart(event);
    alert(`${event.title} added to cart!`);
  };

  const formattedDate = formatEventDate(event.startDate);
  const formattedTime = formatEventTime(event.startTime);

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
        }
      }}
      elevation={2}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="200"
          image={event.image}
          alt={event.title}
          onError={(e) => { 
            e.currentTarget.src = "https://via.placeholder.com/400x300?text=Event+Image";
          }}
          sx={{
            objectFit: 'cover'
          }}
        />
        <Chip
          label={event.price}
          color="error"
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontWeight: 'bold',
            color: 'white'
          }}
        />
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
            minHeight: '2.6em'
          }}
        >
          {event.title}
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
          variant="outlined"
          startIcon={<Visibility />}
          onClick={handleViewDetails}
          sx={{ 
            flex: 1,
            mr: 1,
            textTransform: 'none',
            fontWeight: 'medium'
          }}
        >
          Details
        </Button>
        <Button
          variant="contained"
          startIcon={isAuthenticated ? <ShoppingCart /> : <Login />}
          onClick={handleAddToCart}
          color="error"
          sx={{ 
            flex: 1,
            textTransform: 'none',
            fontWeight: 'medium'
          }}
        >
          {isAuthenticated ? 'Add to Cart' : 'Login to Add'}
        </Button>
      </CardActions>
    </Card>
  );
};