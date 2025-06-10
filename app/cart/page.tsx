'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const router = useRouter();
  const Cart = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const handleBrowseEvents = () => {
    router.push('/');
  };

  const handleQuantityChange = (eventId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      Cart.removeFromCart(eventId);
    } else {
      Cart.updateQuantity(eventId, newQuantity);
    }
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    
    // Simulate checkout process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsCheckingOut(false);
    setOrderComplete(true);
    Cart.clearCart();
  };

  const handleReturnToEvents = () => {
    setOrderComplete(false);
    router.push('/');
  };

  if (orderComplete) {
    return (
      <div className="text-center py-12">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-8 rounded-lg max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4">Order Complete!</h2>
          <p className="mb-4">Thank you for your purchase! (This is a demo, no actual purchase was made)</p>
          <button
            onClick={handleReturnToEvents}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors"
          >
            Return to Events
          </button>
        </div>
      </div>
    );
  }

  if (Cart.state.items.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Your Cart</h1>
        <p className="text-gray-600 text-lg mb-6">Your cart is empty.</p>
        <button
          onClick={handleBrowseEvents}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors"
        >
          Browse Events
        </button>
      </div>
    );
  }

  const totalPrice = Cart.getTotalPrice();

  return (
    <div>
      <h1 className="text-3xl font-bold text-red-500 mb-6">Your Cart</h1>
      
      <div className="space-y-4 mb-8">
        {Cart.state.items.map((item) => {
          const itemTotal = item.price_value * item.quantity;
          
          return (
            <div key={item.event_id} className="bg-white rounded-lg p-6 shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="md:col-span-2">
                  <h3 className="text-xl font-semibold text-red-500 mb-2">{item.title}</h3>
                  <p className="text-gray-600"><strong>Price:</strong> {item.price}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label htmlFor={`quantity-${item.event_id}`} className="text-sm font-medium">
                    Quantity:
                  </label>
                  <input
                    id={`quantity-${item.event_id}`}
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.event_id, parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                  />
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-semibold mb-2">
                    <strong>Item Total:</strong> ${itemTotal.toFixed(2)}
                  </p>
                  <button
                    onClick={() => Cart.removeFromCart(item.event_id)}
                    className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="bg-gray-100 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center text-xl font-bold">
          <span>Total: ${totalPrice.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={handleBrowseEvents}
          className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded transition-colors"
        >
          Continue Shopping
        </button>
        
        <button
          onClick={handleCheckout}
          disabled={isCheckingOut}
          className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-3 px-6 rounded transition-colors font-semibold"
        >
          {isCheckingOut ? 'Processing...' : 'Checkout'}
        </button>
      </div>
    </div>
  );
}