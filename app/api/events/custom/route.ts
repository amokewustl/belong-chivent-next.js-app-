import { NextRequest, NextResponse } from 'next/server';
import Mongo from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    // const session = await getServerSession();
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const mongo = await Mongo.getInstance();
    const db = mongo.clientPromise.db('test'); 
    const collection = db.collection('events');

    const events = await collection.find({}).toArray();

    const transformedEvents = events.map(event => ({
      id: event._id.toString(),
      title: event.title,
      description: event.description || '',
      location: `${event.venue?.name || ''}, ${event.venue?.address?.city || ''}, ${event.venue?.address?.state || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
      startDate: event.dateTime?.start ? new Date(event.dateTime.start).toISOString().split('T')[0] : '',
      endDate: event.dateTime?.end ? new Date(event.dateTime.end).toISOString().split('T')[0] : '',
      startTime: event.dateTime?.start ? new Date(event.dateTime.start).toTimeString().split(' ')[0] : '',
      endTime: event.dateTime?.end ? new Date(event.dateTime.end).toTimeString().split(' ')[0] : '',
      price: event.ticketOptions && event.ticketOptions.length > 0 ? `$${event.ticketOptions[0].price}` : 'N/A',
      price_value: event.ticketOptions && event.ticketOptions.length > 0 ? event.ticketOptions[0].price : 0,
      image: event.images && event.images.length > 0 ? event.images[0] : '',
      has_price: event.ticketOptions && event.ticketOptions.length > 0 && event.ticketOptions[0].price > 0,
      has_image: event.images && event.images.length > 0,
      has_description: !!event.description,
      url: '', // Custom events don't have external URLs
      category: event.category || 'general',
      status: event.status || 'published'
    }));

    return NextResponse.json({ events: transformedEvents }, { status: 200 });
  } catch (error) {
    console.error('Error fetching custom events:', error);
    return NextResponse.json({ error: 'Failed to fetch custom events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // const session = await getServerSession();
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const eventData = await request.json();
    
    const mongo = await Mongo.getInstance();
    const db = mongo.clientPromise.db('test');
    const collection = db.collection('events');

    const mongoEvent = {
      title: eventData.title,
      description: eventData.description || '',
      organizer: new ObjectId(), // You might want to get this from session/auth
      venue: {
        name: eventData.location || '',
        address: {
          street: '',
          city: eventData.location || '',
          state: '',
          zipCode: '',
          country: 'USA'
        },
        capacity: 0
      },
      dateTime: {
        start: new Date(`${eventData.startDate}T${eventData.startTime}`),
        end: new Date(`${eventData.endDate || eventData.startDate}T${eventData.endTime || eventData.startTime}`)
      },
      ticketOptions: eventData.has_price ? [{
        name: 'General Admission',
        description: 'Standard ticket',
        price: eventData.price_value || 0,
        totalQuantity: 100,
        soldQuantity: 0,
        status: 'available'
      }] : [],
      category: eventData.category || 'general',
      status: 'published',
      tags: [],
      images: eventData.image ? [eventData.image] : [],
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'custom' 
    };

    const result = await collection.insertOne(mongoEvent);

    return NextResponse.json({ 
      message: 'Event created successfully',
      id: result.insertedId.toString()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}