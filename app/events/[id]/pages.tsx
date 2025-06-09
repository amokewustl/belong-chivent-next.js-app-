'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Event } from '@/types';
import Link from 'next/link';

export default function EventDetailsPage() {
  const params: any = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching event details for ID:', eventId);
        
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Event not found');
          } else {
            setError('Failed to load event details');
          }
          return;
        }
        
        const eventData = await response.json();
        setEvent(eventData);
        console.log('Event details loaded:', eventData);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center items-center h-96">
            <div className="text-lg text-gray-600">Loading event details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col justify-center items-center h-96">
            <div className="text-lg text-red-500 mb-4">{error || 'Event not found'}</div>
            <Link 
              href="/"
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-red-500 hover:text-red-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </button>
        </div>

        {/* Event Details Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Event Image */}
          <div className="relative h-96">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/800x600?text=Event+Image";
              }}
            />
          </div>

          {/* Event Info */}
          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
              {/* Main Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">{event.title}</h1>
                
                {/* Event Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Date & Time</h3>
                    <div className="space-y-1">
                      <p className="text-gray-600">
                        <span className="font-medium">Date:</span> {event.startDate}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Start:</span> {event.startTime}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">End:</span> {event.endTime}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Location</h3>
                    <p className="text-gray-600">{event.location}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Price</h3>
                    <p className="text-2xl font-bold text-red-500">{event.price}</p>
                  </div>
                </div>

                {/* Description */}
                {event.has_description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">About This Event</h3>
                    <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="lg:w-64 flex flex-col gap-4">
                {event.url && (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-red-500 hover:bg-red-600 text-white text-center py-3 px-6 rounded-lg font-semibold transition-colors"
                  >
                    Buy Tickets
                  </a>
                )}
                
                <Link
                  href="/"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-center py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  Browse More Events
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Event Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${event.has_price ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-gray-600">
                {event.has_price ? 'Pricing Available' : 'No Pricing Info'}
              </span>
            </div>
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${event.has_image ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-gray-600">
                {event.has_image ? 'Official Images' : 'Placeholder Images'}
              </span>
            </div>
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${event.has_description ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-gray-600">
                {event.has_description ? 'Description Available' : 'Limited Description'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}