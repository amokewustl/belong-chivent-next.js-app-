'use client';

import React from 'react';
import { Card, CardContent, CardMedia, CardActions, Typography, Button, Chip, Box, Stack, IconButton, Tooltip} from '@mui/material';
import {
  LocationOn, Event as EventIcon, AccessTime, ShoppingCart, Visibility
} from '@mui/icons-material';
import { Event } from '@/types';
import { useCart } from '@/context/CartContext';
import { dayjs, Dayjs, Chronos } from '@jstiava/chronos';
new Chronos;

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const Cart = useCart();

  const handleViewDetails = () => {
    alert(`Event: ${event.title}\n\nDescription: ${event.description}\n\nLocation: ${event.location}\n\nDate: ${event.startDate}\nTime: ${event.startTime}`);
  };

  const handleAddToCart = () => {
    Cart.addToCart(event);
    alert(`${event.title} added to cart!`);
  };

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
              {event.startDate}
            </Typography>
            {event.startTime !== 'TBA' && (
              <>
                <AccessTime fontSize="small" color="action" sx={{ ml: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {event.startTime}
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
          startIcon={<ShoppingCart />}
          onClick={handleAddToCart}
          color="error"
          sx={{ 
            flex: 1,
            textTransform: 'none',
            fontWeight: 'medium'
          }}
        >
          Add to Cart
        </Button>
      </CardActions>
    </Card>
  );
};