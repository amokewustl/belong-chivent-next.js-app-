'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppBar, Toolbar, Typography, Button, Badge, Box, IconButton} from '@mui/material';
import { ShoppingCart, AdminPanelSettings } from '@mui/icons-material';
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
    <AppBar position="static" color="default" elevation={1} sx={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ cursor: 'pointer' }} onClick={handleGoHome}>
          <Typography variant="h4" component="h1" color="primary" sx={{ fontWeight: 'bold' }}>
            Chivent
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Chicago Events
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Admin Link */}
          <Button
            startIcon={<AdminPanelSettings />}
            onClick={handleGoToAdmin}
            color="inherit"
            sx={{ textTransform: 'none' }}
          >
            Admin
          </Button>
          
          {/* Cart Button */}
          <Button
            variant="contained"
            color="primary"
            startIcon={
              <Badge badgeContent={totalCount} color="secondary">
                <ShoppingCart />
              </Badge>
            }
            onClick={handleGoToCart}
            sx={{ textTransform: 'none' }}
          >
            <Box sx={{ textAlign: 'left', ml: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', lineHeight: 1.2 }}>
                Cart
              </Typography>
              <Typography variant="caption" sx={{ lineHeight: 1 }}>
                ${totalPrice.toFixed(2)}
              </Typography>
            </Box>
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};