import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import Mongo from '@/lib/mongodb';
import { Event } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = params.id;

  if (!eventId) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
  }

  try {
    const mongo = await Mongo.getInstance();
    const db = mongo.clientPromise.db('test');
    const collection = db.collection('events');

    let event = await collection.findOne({ id: eventId });
    
    if (!event && ObjectId.isValid(eventId)) {
      event = await collection.findOne({ _id: new ObjectId(eventId) });
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const transformedEvent = {
      id: event.id || event._id.toString(),
      title: event.title,
      description: event.description || '',
      location: event.venue ? 
        `${event.venue.name || ''}, ${event.venue.address?.city || ''}, ${event.venue.address?.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '') :
        event.location || 'Location TBA',
      startDate: event.dateTime?.start ? 
        new Date(event.dateTime.start).toISOString().split('T')[0] : 
        event.startDate || 'TBA',
      endDate: event.dateTime?.end ? 
        new Date(event.dateTime.end).toISOString().split('T')[0] : 
        event.endDate || '',
      startTime: event.dateTime?.start ? 
        new Date(event.dateTime.start).toTimeString().split(' ')[0] : 
        event.startTime || 'TBA',
      endTime: event.dateTime?.end ? 
        new Date(event.dateTime.end).toTimeString().split(' ')[0] : 
        event.endTime || 'TBA',
      price: event.ticketOptions && event.ticketOptions.length > 0 ? 
        `${event.ticketOptions[0].price}` : 
        event.price || 'N/A',
      price_value: event.ticketOptions && event.ticketOptions.length > 0 ? 
        event.ticketOptions[0].price : 
        event.price_value || 0,
      image: event.images && event.images.length > 0 ? (
        typeof event.images[0] === 'string' ? event.images[0] : event.images[0].url || event.images[0]
      ) : event.image || 'https://via.placeholder.com/800x600?text=Event+Image',
      has_price: (event.ticketOptions && event.ticketOptions.length > 0 && event.ticketOptions[0].price > 0) || 
                 (event.has_price !== undefined ? event.has_price : false),
      has_image: (event.images && event.images.length > 0) || 
                 (event.has_image !== undefined ? event.has_image : false),
      has_description: !!event.description || 
                       (event.has_description !== undefined ? event.has_description : false),
      url: event.url || '',
      source: event.source || 'custom',
      ticketmasterId: event.ticketmasterId || event.id || null
    };

    return NextResponse.json({ event: transformedEvent }, { status: 200 });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updateData = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }
    const mongo = await Mongo.getInstance();
    const db = mongo.clientPromise.db('test');
    const collection = db.collection('events');

    const mongoUpdate: any = {
      updatedAt: new Date()
    };

    if (updateData.title) mongoUpdate.title = updateData.title;
    if (updateData.description !== undefined) mongoUpdate.description = updateData.description;
    if (updateData.location) {
      mongoUpdate['venue.name'] = updateData.location;
      mongoUpdate['venue.address.city'] = updateData.location;
    }
    if (updateData.startDate || updateData.startTime) {
      const startDateTime = new Date(`${updateData.startDate}T${updateData.startTime || '00:00:00'}`);
      mongoUpdate['dateTime.start'] = startDateTime;
    }
    if (updateData.endDate || updateData.endTime) {
      const endDateTime = new Date(`${updateData.endDate || updateData.startDate}T${updateData.endTime || updateData.startTime || '00:00:00'}`);
      mongoUpdate['dateTime.end'] = endDateTime;
    }
    if (updateData.price_value !== undefined) {
      mongoUpdate['ticketOptions.0.price'] = updateData.price_value;
    }
    if (updateData.image) mongoUpdate['images.0'] = updateData.image;
    if (updateData.url) mongoUpdate.url = updateData.url;

    let result;

    result = await collection.updateOne(
      { id: id },
      { $set: mongoUpdate }
    );

    if (result.matchedCount === 0 && ObjectId.isValid(id)) {
      result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: mongoUpdate }
      );
    }

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: 'Event updated successfully' },
      { status: 200 }
    );
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
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const mongo = await Mongo.getInstance();
    const db = mongo.clientPromise.db('test');
    const collection = db.collection('events');
    let result;
    result = await collection.deleteOne({ id: id });

    if (result.deletedCount === 0 && ObjectId.isValid(id)) {
      result = await collection.deleteOne({ _id: new ObjectId(id) });
    }

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: 'Event deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}