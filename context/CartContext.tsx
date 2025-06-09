
'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { CartItem, Event } from '@/types';

interface CartState {
  items: CartItem[];
}

type CartAction = 
  | { type: 'ADD_TO_CART'; payload: Event }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'UPDATE_QUANTITY'; payload: { eventId: string; quantity: number } };

interface CartContextType {
  state: CartState;
  addToCart: (event: Event) => void;
  removeFromCart: (eventId: string) => void;
  clearCart: () => void;
  updateQuantity: (eventId: string, quantity: number) => void;
  getTotalCount: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const event = action.payload;
      const existingItem = state.items.find(item => item.event_id === event.id);
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.event_id === event.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      } else {
        const newItem: CartItem = {
          event_id: event.id,
          title: event.title,
          price: event.price,
          price_value: event.price_value,
          quantity: 1
        };
        return {
          ...state,
          items: [...state.items, newItem]
        };
      }
    }
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.event_id !== action.payload)
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };
    
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.event_id === action.payload.eventId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0)
      };
    
    default:
      return state;
  }
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const addToCart = (event: Event) => {
    dispatch({ type: 'ADD_TO_CART', payload: event });
  };

  const removeFromCart = (eventId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: eventId });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const updateQuantity = (eventId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { eventId, quantity } });
  };

  const getTotalCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => total + (item.price_value * item.quantity), 0);
  };

  const value: CartContextType = {
    state,
    addToCart,
    removeFromCart,
    clearCart,
    updateQuantity,
    getTotalCount,
    getTotalPrice
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};