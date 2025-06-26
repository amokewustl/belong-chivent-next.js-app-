import { NextRequest, NextResponse } from 'next/server';
import { Event } from '@/types';

// make this a database connection
declare global {
  var eventsStorage: Event[];
}

// Initialize if it doesn't exist
if (!global.eventsStorage) {
  global.eventsStorage = [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const event = global.eventsStorage.find(e => e.id === eventId);
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const eventData = await request.json();
    
    // Find the event index
    const eventIndex = global.eventsStorage.findIndex(e => e.id === eventId);
    
    if (eventIndex === -1) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // required fields
    if (!eventData.title || !eventData.startDate || !eventData.startTime) {
      return NextResponse.json(
        { error: 'Missing required fields: title, startDate, and startTime are required' },
        { status: 400 }
      );
    }

    // Update the event
    const updatedEvent: Event = {
      ...global.eventsStorage[eventIndex],
      title: eventData.title,
      subtitle: eventData.subtitle || '',
      description: eventData.description || 'No description available for this event.',
      image: eventData.image || global.eventsStorage[eventIndex].image,
      price: eventData.price || 'N/A',
      price_value: eventData.price_value || 0,
      location: eventData.location || 'Location TBA',
      startDate: eventData.startDate,
      endDate: eventData.endDate || eventData.startDate,
      startTime: eventData.startTime,
      endTime: eventData.endTime || eventData.startTime,
      url: eventData.url || global.eventsStorage[eventIndex].url,
      has_price: eventData.has_price || false,
      has_description: eventData.has_description || false,
      has_image: eventData.has_image || false
    };

    // Replace in storage
    global.eventsStorage[eventIndex] = updatedEvent;

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const eventIndex = global.eventsStorage.findIndex(e => e.id === eventId);
    
    if (eventIndex === -1) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Remove from storage
    const deletedEvent = global.eventsStorage.splice(eventIndex, 1)[0];

    return NextResponse.json({ 
      message: 'Event deleted successfully',
      deletedEvent 
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}