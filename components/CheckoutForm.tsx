'use client';

import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';
import { Button, Box, Alert, CircularProgress } from '@mui/material';

interface CheckoutFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/cart?payment=success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message || 'Payment failed');
        onError(error.message || 'Payment failed');
      } else {
        setMessage('An unexpected error occurred');
        onError('An unexpected error occurred');
      }
    } else {
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <PaymentElement />
      </Box>
      
      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={isProcessing || !stripe || !elements}
        fullWidth
        size="large"
        startIcon={isProcessing ? <CircularProgress size={20} /> : null}
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </Button>
    </form>
  );
};