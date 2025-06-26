'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Typography, Alert, CircularProgress, Chip, IconButton } from '@mui/material';
import { Close, CloudUpload, Delete } from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { Event } from '@/types';
import { useUploadThing } from '@/utils/uploadthing';

interface EventFormDialogProps {
  open: boolean;
  event: Event | null;
  onClose: () => void;
  onSubmit: (eventData: any) => void; 
}

interface FormData {
  title: string;
  subtitle: string;
  description: string;
  price: string;
  location: string;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  startTime: Dayjs | null;
  endTime: Dayjs | null;
  images: string[];
}

export const EventFormDialog: React.FC<EventFormDialogProps> = ({
  open,
  event,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    subtitle: '',
    description: '',
    price: '',
    location: '',
    startDate: null,
    endDate: null,
    startTime: null,
    endTime: null,
    images: []
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

 
  const useUploadThing = (endpoint: string, options: any) => {
    return {
      startUpload: async (files: File[]) => {
        setUploading(true);
        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          options.onUploadProgress?.(i / 100);
        }
        setUploading(false);
        return files.map((file, index) => ({
          url: `https://example.com/uploaded-${Date.now()}-${index}.jpg`,
          key: `uploaded-${Date.now()}-${index}`
        }));
      }
    };
  };

  const { startUpload } = useUploadThing('imageUploader', {
    onUploadProgress: (progress: number) => {
      const value = Math.round(progress * 100);
      if (value <= 95) {
        setUploadProgress(value);
      } else {
        setUploadProgress(null);
      }
    },
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        subtitle: (event as any).subtitle || '',
        description: event.description || '',
        price: event.price_value ? event.price_value.toString() : '',
        location: event.location || '',
        startDate: event.startDate ? dayjs(event.startDate) : null,
        endDate: (event as any).endDate ? dayjs((event as any).endDate) : null,
        startTime: event.startTime ? dayjs(`2000-01-01T${event.startTime}`) : null,
        endTime: event.endTime ? dayjs(`2000-01-01T${event.endTime}`) : null,
        images: event.image ? [event.image] : []
      });
    } else {
      // Reset form for new event
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        price: '',
        location: '',
        startDate: null,
        endDate: null,
        startTime: null,
        endTime: null,
        images: []
      });
    }
    setErrors({});
  }, [event, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.title.trim()) {
      newErrors.title = 'Event name is required';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    // Date/time check
    if (formData.startDate && formData.endDate) {
      if (formData.endDate.isBefore(formData.startDate)) {
        newErrors.endDate = 'End date cannot be before start date';
      }
    }

    if (formData.startTime && formData.endTime && formData.startDate && formData.endDate) {
      const startDateTime = formData.startDate
        .hour(formData.startTime.hour())
        .minute(formData.startTime.minute());
      const endDateTime = (formData.endDate || formData.startDate)
        .hour(formData.endTime.hour())
        .minute(formData.endTime.minute());
      
      if (endDateTime.isBefore(startDateTime)) {
        newErrors.endTime = 'End time cannot be before start time';
      }
    }

    if (formData.price && isNaN(parseFloat(formData.price))) {
      newErrors.price = 'Price must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      setUploading(true);
      const uploadedImages = await startUpload(files);
      
      if (uploadedImages) {
        const imageUrls = uploadedImages.map(img => img.url);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...imageUrls]
        }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      // Handle upload error
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const eventData: any = {
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      startDate: formData.startDate?.format('YYYY-MM-DD'),
      endDate: formData.endDate?.format('YYYY-MM-DD') || formData.startDate?.format('YYYY-MM-DD'),
      startTime: formData.startTime?.format('HH:mm:ss'),
      endTime: formData.endTime?.format('HH:mm:ss'),
      price: formData.price ? `${parseFloat(formData.price).toFixed(2)}` : 'N/A',
      price_value: formData.price ? parseFloat(formData.price) : 0,
      image: formData.images[0] || '',
      has_price: !!formData.price && !isNaN(parseFloat(formData.price)),
      has_image: formData.images.length > 0,
      has_description: !!formData.description.trim()
    };

    onSubmit(eventData);
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {event ? 'Edit Event' : 'Create New Event'}
          </Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Basic Info */}
              <TextField
                fullWidth
                label="Event Name *"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
                variant="outlined"
              />

              <TextField
                fullWidth
                label="Subtitle"
                value={formData.subtitle}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                variant="outlined"
              />

              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={4}
                variant="outlined"
              />

              {/* Price and Location Row */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: '200px' }}>
                  <TextField
                    fullWidth
                    label="Price ($)"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    error={!!errors.price}
                    helperText={errors.price}
                    type="number"
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: '200px' }}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    variant="outlined"
                  />
                </Box>
              </Box>

              {/* Date Row */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: '200px' }}>
                  <DatePicker
                    label="Start Date *"
                    value={formData.startDate}
                    onChange={(date) => handleInputChange('startDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.startDate,
                        helperText: errors.startDate
                      }
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: '200px' }}>
                  <DatePicker
                    label="End Date"
                    value={formData.endDate}
                    onChange={(date) => handleInputChange('endDate', date)}
                    minDate={formData.startDate || undefined}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.endDate,
                        helperText: errors.endDate || 'Leave empty to use start date'
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* Time Row */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: '200px' }}>
                  <TimePicker
                    label="Start Time *"
                    value={formData.startTime}
                    onChange={(time) => handleInputChange('startTime', time)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.startTime,
                        helperText: errors.startTime
                      }
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: '200px' }}>
                  <TimePicker
                    label="End Time"
                    value={formData.endTime}
                    onChange={(time) => handleInputChange('endTime', time)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.endTime,
                        helperText: errors.endTime
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* Image Upload */}
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Event Images
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="image-upload"
                    multiple
                    type="file"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  <label htmlFor="image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={uploading ? <CircularProgress size={16} /> : <CloudUpload />}
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Upload Images'}
                    </Button>
                  </label>
                </Box>

                {uploadProgress !== null && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Upload Progress: {uploadProgress}%
                    </Typography>
                  </Box>
                )}

                {formData.images.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.images.map((image, index) => (
                      <Box key={index} sx={{ position: 'relative' }}>
                        <Box
                          component="img"
                          src={image}
                          alt={`Event image ${index + 1}`}
                          sx={{
                            width: 100,
                            height: 100,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveImage(index)}
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            bgcolor: 'error.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'error.dark' }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              {/* Required Fields Note */}
              <Alert severity="info">
                <Typography variant="body2">
                  * Required fields: Event Name, Start Date, and Start Time
                </Typography>
              </Alert>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={uploading}
            >
              {event ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};