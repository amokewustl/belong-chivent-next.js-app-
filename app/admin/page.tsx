'use client';

import React, { useState, useEffect } from 'react';
import { Event } from '@/types';
import { fetchEnoughEvents } from '@/lib/api';

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    avgPrice: 0,
    eventsWithImages: 0,
    eventsWithPrices: 0
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { events: fetchedEvents } = await fetchEnoughEvents(50, 10, 0);
      setEvents(fetchedEvents);
      calculateStats(fetchedEvents);
    } catch (err) {
      setError('Failed to load events');
      console.error('Error loading events:', err);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-lg text-gray-600">Loading admin data...</div>
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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-red-500 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-red-100">Manage events and view analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Events</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalEvents}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Average Price</h3>
          <p className="text-3xl font-bold text-green-600">${stats.avgPrice.toFixed(2)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Events with Images</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.eventsWithImages}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Events with Prices</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.eventsWithPrices}</p>
        </div>
      </div>
    </div>
  );
}