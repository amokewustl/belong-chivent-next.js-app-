'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Button, Paper, Box, TextField, Alert, CircularProgress, Divider} from '@mui/material';
import { Delete, ShoppingBag, ArrowBack } from '@mui/icons-material';
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
      <Box className="text-center" sx={{ py: 8 }}>
        <Alert severity="success" sx={{ maxWidth: 500, mx: 'auto', p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Order Complete!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Thank you for your purchase! (This is a demo, no actual purchase was made)
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleReturnToEvents}
            startIcon={<ArrowBack />}
          >
            Return to Events
          </Button>
        </Alert>
      </Box>
    );
  }

  if (Cart.state.items.length === 0) {
    return (
      <Box className="text-center" sx={{ py: 8 }}>
        <ShoppingBag sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h4" color="primary" gutterBottom>
          Your Cart
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Your cart is empty.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleBrowseEvents}
          size="large"
        >
          Browse Events
        </Button>
      </Box>
    );
  }

  const totalPrice = Cart.getTotalPrice();

  return (
    <Box>
      <Typography variant="h4" color="primary" gutterBottom>
        Your Cart
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        {Cart.state.items.map((item) => {
          const itemTotal = item.price_value * item.quantity;
          
          return (
            <Paper key={item.event_id} className="cart-item" elevation={1} sx={{ p: 3, mb: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>Price:</strong> {item.price}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    Quantity:
                  </Typography>
                  <TextField
                    type="number"
                    size="small"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.event_id, parseInt(e.target.value) || 0)}
                    inputProps={{ min: 0, style: { textAlign: 'center' } }}
                    sx={{ width: 80 }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6">
                    ${itemTotal.toFixed(2)}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Delete />}
                    onClick={() => Cart.removeFromCart(item.event_id)}
                  >
                    Remove
                  </Button>
                </Box>
              </Box>
            </Paper>
          );
        })}
      </Box>
      
      <Paper className="cart-total" elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          Total: ${totalPrice.toFixed(2)}
        </Typography>
      </Paper>
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleBrowseEvents}
          size="large"
        >
          Continue Shopping
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleCheckout}
          disabled={isCheckingOut}
          size="large"
          startIcon={isCheckingOut ? <CircularProgress size={20} /> : null}
        >
          {isCheckingOut ? 'Processing...' : 'Checkout'}
        </Button>
      </Box>
    </Box>
  );
}