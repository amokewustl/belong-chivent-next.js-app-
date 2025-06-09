
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

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
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

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Events Management</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={event.image}
                          alt={event.title}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">
                          {event.title}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {event.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{event.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{event.startDate}</div>
                    <div className="text-sm text-gray-500">{event.startTime}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {event.has_price && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Price
                        </span>
                      )}
                      {event.has_image && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Image
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEventClick(event)}
                      className="text-red-600 hover:text-red-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Event Details</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <img
                    src={selectedEvent.image}
                    alt={selectedEvent.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedEvent.title}</h4>
                  <p className="text-gray-600 mt-2">{selectedEvent.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Price</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedEvent.price}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date & Time</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedEvent.startDate}</p>
                    <p className="text-sm text-gray-600">{selectedEvent.startTime}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedEvent.location}</p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={closeModal}
                    className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                  >
                    Close
                  </button>
                  <a
                    href={selectedEvent.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors"
                  >
                    View on Ticketmaster
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}