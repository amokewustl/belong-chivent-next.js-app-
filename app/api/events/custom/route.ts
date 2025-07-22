import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Event from '@/models/event';
import User from '@/models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'random-string';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify admin authentication
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await User.findById(decoded.userId);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch only custom events (not from Ticketmaster)
    const customEvents = await Event.find({
      $or: [
        { externalSource: { $exists: false } },
        { externalSource: { $ne: 'ticketmaster' } }
      ]
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      events: customEvents,
      total: customEvents.length
    });

  } catch (error) {
    console.error('Error fetching custom events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom events', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}