
'use client';

import React from 'react';
import { Event } from '@/types';
import { useCart } from '@/context/CartContext';

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const Cart = useCart();

  const handleViewDetails = () => {
    // For now, just show an alert with event details
    // Later you can navigate to a proper details page
    alert(`Event: ${event.title}\n\nDescription: ${event.description}\n\nLocation: ${event.location}\n\nDate: ${event.startDate}\nTime: ${event.startTime}`);
  };

  const handleAddToCart = () => {
    Cart.addToCart(event);
    // Optional: Show a brief confirmation
    alert(`${event.title} added to cart!`);
  };

  return (
    <div className="event-card bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      {/* Fixed image container with consistent dimensions */}
      <div className="relative w-full h-48 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback image if the original fails to load
            e.currentTarget.src = "https://via.placeholder.com/400x300?text=Event+Image";
          }}
        />
        {/* Price badge */}
        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
          {event.price}
        </div>
      </div>

      {/* Event content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {event.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {event.description}
        </p>

        {/* Event details */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium">📍</span>
            <span className="ml-1 line-clamp-1">{event.location}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium">📅</span>
            <span className="ml-1">{event.startDate}</span>
            {event.startTime !== 'TBA' && (
              <span className="ml-2">🕐 {event.startTime}</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleViewDetails}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors text-center font-medium"
           >
            View Details
          </button>
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors text-center font-medium"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};