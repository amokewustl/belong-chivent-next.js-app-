import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Mongo from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { SavedEvent, User } from '@/types'; 

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function getUserFromToken(request: NextRequest): Promise<User | null> {
  try {
    console.log('=== Debug getUserFromToken ===');
    
    const token = request.cookies.get('admin-token')?.value;
    console.log('Token found:', !!token);
    console.log('Token value (first 20 chars):', token?.substring(0, 20));
    
    if (!token) {
      console.log('No token found in cookies');
      return null;
    }

    console.log('JWT_SECRET exists:', !!JWT_SECRET);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    console.log('JWT decoded successfully. UserId:', decoded.userId);
    
    const mongo = await Mongo.getInstance();
    const db = mongo.clientPromise.db('test');
    const usersCollection = db.collection('users');
    console.log('MongoDB connection established');
    
    const userId = new ObjectId(decoded.userId);
    console.log('Looking for user with ObjectId:', userId.toString());
    
    const user = await usersCollection.findOne({ _id: userId }) as User | null;
    console.log('User found:', !!user);
    console.log('User ID from DB:', user?._id?.toString());
    
    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT Error details:', error.message);
    }
    if (error instanceof Error && error.message.includes('ObjectId')) {
      console.error('ObjectId Error - invalid userId format:', error.message);
    }
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== POST /api/me/saved-events ===');
    
    const user = await getUserFromToken(request);
    
    if (!user) {
      console.log('Authorization failed - no user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authorized successfully:', user._id.toString());

    const body = await request.json();
    const { eventId, eventTitle } = body;
    console.log('Request body:', body);
    console.log('Parsed data:', { eventId, eventTitle });
    
    if (!eventId) {
      console.log('Missing eventId in request');
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const mongo = await Mongo.getInstance();
    const db = mongo.clientPromise.db('test');
    const usersCollection = db.collection('users');

    const existingSavedEvent = user.savedEvents?.find(
      (savedEvent) => savedEvent.eventId === eventId
    );

    if (existingSavedEvent) {
      console.log('Event already saved:', eventId);
      return NextResponse.json({ error: 'Event already saved' }, { status: 400 });
    }

    const savedEvent: SavedEvent = {
      eventId,
      eventTitle: eventTitle || 'Saved Event',
      savedAt: new Date()
    };

    console.log('Saving event:', savedEvent);

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(user._id) },
      { 
        $push: { 
          savedEvents: savedEvent 
        } 
      } as any
    );

    console.log('Update result:', result);

    return NextResponse.json({ 
      message: 'Event saved successfully',
      savedEvent 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error saving event:', error);
    return NextResponse.json({ 
      error: 'Failed to save event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('=== DELETE /api/me/saved-events ===');
    
    const user = await getUserFromToken(request);
    
    if (!user) {
      console.log('Authorization failed - no user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authorized successfully:', user._id.toString());

    const body = await request.json();
    const { eventId, eventTitle } = body;
    console.log('Request body:', body);
    console.log('Parsed data:', { eventId, eventTitle });
    
    if (!eventId) {
      console.log('Missing eventId in request body');
      return NextResponse.json({ 
        error: 'Event ID is required',
        received: body 
      }, { status: 400 });
    }

    const mongo = await Mongo.getInstance();
    const db = mongo.clientPromise.db('test');
    const usersCollection = db.collection('users');

    console.log('Attempting to remove event from saved events:', eventId);
    console.log('Current user saved events:', user.savedEvents?.map(e => e.eventId));

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(user._id) },
      { 
        $pull: { 
          savedEvents: { eventId: eventId } 
        } 
      } as any
    );

    console.log('Remove result:', result);

    if (result.modifiedCount === 0) {
      console.log('No documents were modified - event might not be in saved events');
    }

    return NextResponse.json({ 
      message: 'Event removed from saved events',
      modifiedCount: result.modifiedCount
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error removing saved event:', error);
    return NextResponse.json({ 
      error: 'Failed to remove saved event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ 
      savedEvents: user.savedEvents || [] 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching saved events:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch saved events' 
    }, { status: 500 });
  }
}