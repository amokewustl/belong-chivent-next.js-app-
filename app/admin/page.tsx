'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Box, Paper, CircularProgress, Alert, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Chip} from '@mui/material';
import { Event as EventIcon, AttachMoney, Image, LocalOffer, Add, Edit, Delete } from '@mui/icons-material';
import { Event } from '@/types';
import { fetchEnoughEvents } from '@/lib/api';
import { EventFormDialog } from '@/components/EventFormDialog';

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState({
    totalEvents: 0,
    avgPrice: 0,
    eventsWithImages: 0,
    eventsWithPrices: 0
  });
  const router = useRouter();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load both custom events and Ticketmaster events
      const [customEventsResponse, ticketmasterData] = await Promise.all([
        fetch('/api/events', {
          credentials: 'include', 
        }).then(async res => {
          if (res.status === 401) {
            // User is not authenticated redirect to login
            router.push('/admin');
            throw new Error('Authentication required');
          }
          if (!res.ok) {
            throw new Error(`Failed to fetch events: ${res.status}`);
          }
          return res.json();
        }),
        fetchEnoughEvents(50, 10, 0)
      ]);

      // Combine custom and Ticketmaster events
      const customEvents = customEventsResponse.events || [];
      const ticketmasterEvents = ticketmasterData.events || [];
      const allEvents = [...customEvents, ...ticketmasterEvents];

      setEvents(allEvents);
      calculateStats(allEvents);
    } catch (err) {
      console.error('Error loading events:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load events';
      
      if (errorMessage.includes('Authentication required')) {
        return;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (eventList: Event[]) => {
    const totalEvents = eventList.length;
    const eventsWithPrices = eventList.filter(e => e.has_price).length;
    const eventsWithImages = eventList.filter(e => e.has_image).length;
    const avgPrice = eventList
      .filter(e => e.has_price)
      .reduce((sum, e) => sum + e.price_value, 0) / eventsWithPrices || 0;

    setStats({
      totalEvents,
      avgPrice,
      eventsWithImages,
      eventsWithPrices
    });
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setFormOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setFormOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include', 
      });

      if (response.status === 401) {
        router.push('/admin');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      setSuccess('Event deleted successfully');
      loadEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event');
    }
  };

  const handleFormSubmit = async (eventData: Partial<Event>) => {
    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
        credentials: 'include', 
      });

      if (response.status === 401) {
        router.push('/admin');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to ${editingEvent ? 'update' : 'create'} event`);
      }

      setSuccess(`Event ${editingEvent ? 'updated' : 'created'} successfully`);
      setFormOpen(false);
      setEditingEvent(null);
      loadEvents();
    } catch (err) {
      console.error('Error saving event:', err);
      setError(`Failed to ${editingEvent ? 'update' : 'create'} event`);
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingEvent(null);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleRetry = () => {
    setError(null);
    loadEvents();
  };

  if (loading) {
    return (
      <Box className="loading-container">
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="primary" />
          <Typography className="loading-text" sx={{ mt: 2 }}>
            Loading admin data...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error && events.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 2, maxWidth: 600, mx: 'auto' }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
        <Typography color="text.secondary">
          Unable to load admin dashboard data.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Messages */}
      {error && (
        <Alert severity="error" onClose={clearMessages} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={clearMessages} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Header */}
      <Paper className="admin-header" elevation={0} sx={{ bgcolor: 'primary.main', color: 'white', p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography className="admin-title" variant="h3" component="h1">
              Admin Dashboard
            </Typography>
            <Typography className="admin-subtitle" variant="h6">
              Manage events and view analytics
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Add />}
            onClick={handleCreateEvent}
            sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
          >
            Create Event
          </Button>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Box 
        className="stats-container" 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 3, 
          mb: 4,
          '& > *': {
            flex: '1 1 250px',
            minWidth: '250px'
          }
        }}
      >
        <Paper sx={{ p: 3, borderLeft: '4px solid', borderColor: 'info.main' }} elevation={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <EventIcon color="info" sx={{ mr: 1 }} />
            <Typography variant="h6" color="text.secondary">
              Total Events
            </Typography>
          </Box>
          <Typography variant="h3" color="info.main" sx={{ fontWeight: 'bold' }}>
            {stats.totalEvents}
          </Typography>
        </Paper>
        
        <Paper sx={{ p: 3, borderLeft: '4px solid', borderColor: 'success.main' }} elevation={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AttachMoney color="success" sx={{ mr: 1 }} />
            <Typography variant="h6" color="text.secondary">
              Average Price
            </Typography>
          </Box>
          <Typography variant="h3" color="success.main" sx={{ fontWeight: 'bold' }}>
            ${stats.avgPrice.toFixed(2)}
          </Typography>
        </Paper>
        
        <Paper sx={{ p: 3, borderLeft: '4px solid', borderColor: 'secondary.main' }} elevation={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Image color="secondary" sx={{ mr: 1 }} />
            <Typography variant="h6" color="text.secondary">
              Events with Images
            </Typography>
          </Box>
          <Typography variant="h3" color="secondary.main" sx={{ fontWeight: 'bold' }}>
            {stats.eventsWithImages}
          </Typography>
        </Paper>
        
        <Paper sx={{ p: 3, borderLeft: '4px solid', borderColor: 'warning.main' }} elevation={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LocalOffer color="warning" sx={{ mr: 1 }} />
            <Typography variant="h6" color="text.secondary">
              Events with Prices
            </Typography>
          </Box>
          <Typography variant="h3" color="warning.main" sx={{ fontWeight: 'bold' }}>
            {stats.eventsWithPrices}
          </Typography>
        </Paper>
      </Box>

      {/* Events Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Events Management
        </Typography>
        
        {events.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No events found. Click "Create Event" to add your first event.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Event</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {event.has_image && (
                          <Box
                            component="img"
                            src={event.image}
                            alt={event.title}
                            sx={{ width: 50, height: 50, objectFit: 'cover', mr: 2, borderRadius: 1 }}
                          />
                        )}
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {event.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {event.description?.substring(0, 100)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {event.startDate}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {event.startTime} - {event.endTime}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {event.has_price ? (
                        <Typography variant="body2" color="success.main">
                          {event.price}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {event.location}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {event.has_price && (
                          <Chip label="Price" size="small" color="success" variant="outlined" />
                        )}
                        {event.has_image && (
                          <Chip label="Image" size="small" color="primary" variant="outlined" />
                        )}
                        {event.has_description && (
                          <Chip label="Description" size="small" color="secondary" variant="outlined" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          color="primary"
                          onClick={() => handleEditEvent(event)}
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteEvent(event.id)}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Event Form Dialog */}
      <EventFormDialog
        open={formOpen}
        event={editingEvent}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
      />
    </Box>
  );
}