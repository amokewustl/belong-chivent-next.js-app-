'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filters = [
    { id: 'all', label: 'All Events', count: 0 },
    { id: 'music', label: 'Music', count: 0 },
    { id: 'sports', label: 'Sports', count: 0 },
    { id: 'theater', label: 'Theater', count: 0 },
    { id: 'comedy', label: 'Comedy', count: 0 },
    { id: 'family', label: 'Family', count: 0 },
  ];

  const priceRanges = [
    { id: 'free', label: 'Free', min: 0, max: 0 },
    { id: 'under-50', label: 'Under $50', min: 0, max: 50 },
    { id: '50-100', label: '$50 - $100', min: 50, max: 100 },
    { id: '100-200', label: '$100 - $200', min: 100, max: 200 },
    { id: 'over-200', label: 'Over $200', min: 200, max: 9999 },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Filters</h2>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Links */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link 
                href="/" 
                className="block text-gray-600 hover:text-red-500 transition-colors"
              >
                🏠 Home
              </Link>
              <Link 
                href="/favorites" 
                className="block text-gray-600 hover:text-red-500 transition-colors"
              >
                ❤️ Favorites
              </Link>
              <Link 
                href="/my-tickets" 
                className="block text-gray-600 hover:text-red-500 transition-colors"
              >
                🎫 My Tickets
              </Link>
            </div>
          </div>

          {/* Event Categories */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Categories</h3>
            <div className="space-y-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`
                    w-full text-left px-3 py-2 rounded transition-colors
                    ${activeFilter === filter.id 
                      ? 'bg-red-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <span>{filter.label}</span>
                  {filter.count > 0 && (
                    <span className="float-right text-sm opacity-75">
                      {filter.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Range</h3>
            <div className="space-y-2">
              {priceRanges.map((range) => (
                <label key={range.id} className="flex items-center">
                  <input
                    type="radio"
                    name="priceRange"
                    value={range.id}
                    className="mr-3 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-gray-600">{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Location</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter city or venue"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="text-sm text-gray-500">
                Currently showing: Chicago, IL
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Date</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Apply Filters Button */}
          <button className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded font-semibold transition-colors">
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};