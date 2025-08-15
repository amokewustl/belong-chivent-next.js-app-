import { NextRequest, NextResponse } from 'next/server';
import { searchEvents } from '@/lib/search';
import Mongo from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const genre = searchParams.get('genre') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');

    try {
      const mongo = await Mongo.getInstance();
      const db = mongo.clientPromise.db('test');
      const collection = db.collection('events');
      const totalEvents = await collection.countDocuments();
     
      if (totalEvents === 0) {
        return NextResponse.json({
          error: 'No events in database. Please refresh the homepage first to populate events.',
          events: [],
          total: 0,
          hasMore: false,
          debug: { 
            totalEvents: 0,
            suggestion: 'Call /api/events endpoint first to populate database'
          }
        }, { status: 200 });
      }

      const sampleEvents = await collection.find({}).limit(3).toArray();
      
      sampleEvents.forEach((event, index) => {
        console.log(`Event ${index + 1}:`, {
          id: event._id?.toString(),
          title: event.title || event.name,
          category: event.category,
          venue: event.venue?.name,
          location: event.location,
          hasDateTimeStart: !!event.dateTime?.start,
          hasStartDate: !!event.startDate,
          source: event.source
        });
      });

      if (query || genre) {
        const testQuery: any = {};
        if (query) {
          testQuery.$or = [
            { title: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } }
          ];
        }
        const testResults = await collection.find(testQuery).limit(1).toArray();
      }

    } catch (dbError) {
      return NextResponse.json(
        { 
          error: 'Database connection failed', 
          events: [], 
          total: 0, 
          hasMore: false,
          details: dbError instanceof Error ? dbError.message : 'Database error'
        },
        { status: 500 }
      );
    }

    const result = await searchEvents({
      query,
      genre,
      limit,
      skip
    });

    console.log('Search completed:', {
      eventsFound: result.events.length,
      total: result.total,
      hasMore: result.hasMore
    });

    // Enhanced debugging for empty results
    if (result.events.length === 0 && (query || genre)) {
      const mongo = await Mongo.getInstance();
      const db = mongo.clientPromise.db('test');
      const collection = db.collection('events');
      
      const partialMatches = await collection.find({
        $or: [
          { title: { $regex: query.split(' ')[0] || '', $options: 'i' } },
          { category: { $exists: true } }
        ]
      }).limit(5).toArray();
      const availableCategories = await collection.distinct('category');
    }

    return NextResponse.json({
      ...result,
      debug: {
        queryReceived: query,
        genreReceived: genre,
        limitReceived: limit,
        skipReceived: skip,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Search failed', 
        events: [], 
        total: 0, 
        hasMore: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}