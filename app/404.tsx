'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Home, ArrowBack, Search } from '@mui/icons-material';

export default function NotFound() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'background.default',
      p: 3
    }}>
      <Paper sx={{ 
        maxWidth: 500, 
        width: '100%', 
        p: 4, 
        textAlign: 'center' 
      }} elevation={3}>
        
        {/* 404 Icon */}
        <Box sx={{ mb: 3 }}>
          <Search sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        </Box>

        {/* Title */}
        <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
          404
        </Typography>
        
        <Typography variant="h5" color="text.primary" sx={{ mb: 2 }}>
          Page Not Found
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Sorry, the page you're looking for doesn't exist or has been moved.
        </Typography>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleGoBack}
            sx={{ 
              flex: 1,
              textTransform: 'none',
              py: 1.5
            }}
          >
            Go Back
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<Home />}
            onClick={handleGoHome}
            sx={{ 
              flex: 1,
              textTransform: 'none',
              py: 1.5
            }}
          >
            Go Home
          </Button>
        </Box>

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
            Chivent
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Chicago Events
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}