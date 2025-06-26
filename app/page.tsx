'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Button, CircularProgress, Alert, Box } from '@mui/material';
import { Event } from '@/types';
import { fetchEnoughEvents } from '@/lib/api';
import { EventCard } from '@/components/EventCard';

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const { events: fetchedEvents } = await fetchEnoughEvents(20, 5, page);
      setEvents(fetchedEvents);
    } catch (err) {
      setError('Failed to load events. Please try again.');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  if (loading) {
    return (
      <Box className="loading-container">
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="primary" size={40} />
          <Typography className="loading-text" sx={{ mt: 2 }}>
            Loading events...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="error-container">
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h3" component="h1" color="primary" gutterBottom>
        Upcoming Events in Chicago
      </Typography>
      
      <Box className="button-group">
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
      
      <Typography variant="body1" color="text.secondary" className="mb-24">
        Page {currentPage + 1}
      </Typography>
      
      {events.length === 0 ? (
        <Box className="text-center mt-24">
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
  );
}