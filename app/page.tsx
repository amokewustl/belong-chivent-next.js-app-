
'use client';

import React, { useState, useEffect } from 'react';
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
      <div className="flex justify-center items-center min-h-96">
        <div className="text-lg text-gray-600">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-red-500 mb-6">Upcoming Events in Chicago</h1>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 0}
          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-2 px-4 rounded transition-colors"
        >
          Previous Page
        </button>
        
        <button
          onClick={handleNextPage}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors"
        >
          Next Page
        </button>
      </div>
      
      <p className="text-gray-600 mb-6">Page {currentPage + 1}</p>
      
      {events.length === 0 ? (
        <div className="text-center text-gray-600 mt-8">
          <p>No events found for this page. Try another page or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}