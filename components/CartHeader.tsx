
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export const CartHeader: React.FC = () => {
  const Cart = useCart();
  const router = useRouter();
  const totalCount = Cart.getTotalCount();
  const totalPrice = Cart.getTotalPrice();

  const handleGoToCart = () => {
    router.push('/cart');
  };

  const handleGoToAdmin = () => {
    router.push('/admin');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="bg-white shadow-md border-b border-gray-200 p-4">
      <div className="flex justify-between items-center">
        <div className="cursor-pointer" onClick={handleGoHome}>
          <h1 className="text-2xl font-bold text-red-500">Chivent</h1>
          <p className="text-gray-600 text-sm">Chicago Events</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Admin Link */}
          <button
            onClick={handleGoToAdmin}
            className="text-gray-600 hover:text-red-500 transition-colors text-sm font-medium"
          >
            Admin
          </button>
          
          {/* Cart Button */}
          <button
            onClick={handleGoToCart}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors flex items-center gap-2"
          >
            <span>🛒</span>
            <div className="text-left">
              <div className="text-sm font-medium">
                Cart ({totalCount})
              </div>
              <div className="text-xs">
                ${totalPrice.toFixed(2)}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};