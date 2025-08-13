import { NextRequest, NextResponse } from 'next/server';
import { TicketmasterEvent, ApiCacheEntry } from '@/types';
import { dayjs } from '@jstiava/chronos';
import { generateUniqueId } from '@/utils/idUtils';
import Mongo from '@/lib/mongodb';


const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY || "pmbdy5uLSZnpbGGenJyLkA7xeRCPS20L";

// In-memory cache
let eventsCache: Record<string, ApiCacheEntry> = {};

function isUpcomingEvent(startDate: string): boolean {
  if (startDate === 'TBA' || !startDate) {
    return true; 
  }
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const eventDate = new Date(startDate);
    return eventDate >= today;
  } catch (error) {
    console.warn(`Invalid date format: ${startDate}`);
    return true; 
  }
}

// GET - Fetch all events (both custom and ticketmaster)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetCount = parseInt(searchParams.get('targetCount') || '20');
    const maxPages = parseInt(searchParams.get('maxPages') || '5');
    const currentPage = parseInt(searchParams.get('page') || '0');
    const refresh = searchParams.get('refresh') === 'true';

    let mongoEvents: any[] = [];
    try {
      const mongo = await Mongo.getInstance();
      const db = mongo.clientPromise.db('test');
      const collection = db.collection('events');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const mongoResult = await collection.find({
        $or: [
          { 'dateTime.start': { $gte: today } },
          { startDate: 'TBA' }, 
          { startDate: { $exists: false } }, 
          { startDate: { $gte: today.toISOString().split('T')[0] } } 
        ]
      })
      .sort({ 'dateTime.start': 1, startDate: 1 }) 
      .limit(targetCount * 2) 
      .toArray();
      
      mongoEvents = mongoResult.map(event => {
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
            `$${event.ticketOptions[0].price}` : 
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
        
        return transformedEvent;
      })
      .filter(event => isUpcomingEvent(event.startDate)) 
      .slice(0, targetCount); 
    } catch (mongoError) {
      console.error(' MongoDB error (non-blocking):', mongoError);
    }

    let ticketmasterEvents: any[] = [];
    try {
      const tmResult = await fetchTicketmasterEvents(targetCount - mongoEvents.length, maxPages, currentPage);
      ticketmasterEvents = tmResult.events.filter(event => isUpcomingEvent(event.startDate));
    } catch (tmError) {
      console.error('Ticketmaster error:', tmError);
    }

    const allEvents = [...mongoEvents, ...ticketmasterEvents]
      .sort((a, b) => {
        if (a.startDate === 'TBA' && b.startDate === 'TBA') return 0;
        if (a.startDate === 'TBA') return 1;
        if (b.startDate === 'TBA') return -1;
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      });
      
    if (allEvents.length === 0) {
      return NextResponse.json({
        events: [],
        filteredCount: 0,
        message: 'No upcoming events found. This could be due to API connectivity issues or all events being in the past.'
      }, { status: 200 });
    }

    return NextResponse.json({
      events: allEvents,
      filteredCount: allEvents.length,
      sources: {
        mongodb: mongoEvents.length,
        ticketmaster: ticketmasterEvents.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error('💥 Critical error in events API:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch events',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function fetchTicketmasterEvents(
  targetCount: number, 
  maxPages: number, 
  currentPage: number
): Promise<{ events: any[]; filteredCount: number }> {
  const allEvents: any[] = [];
  let filteredCount = 0;
  
  if (targetCount <= 0) {
    return { events: [], filteredCount: 0 };
  }
  
  for (let page = currentPage; page < currentPage + maxPages && allEvents.length < targetCount; page++) {
    
    const url = 'https://app.ticketmaster.com/discovery/v2/events.json';
    const today = new Date();
    const todayString = today.toISOString().split('T')[0] + 'T00:00:00Z';
    
    const params = new URLSearchParams({
      apikey: TICKETMASTER_API_KEY,
      city: 'Chicago',
      stateCode: 'IL',
      size: '200',
      page: page.toString(),
      sort: 'date,asc',
      startDateTime: todayString
    });

    try {
      const response = await fetch(`${url}?${params}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ChiventApp/1.0'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Ticketmaster API key');
        }
        if (response.status === 429) {
          break;
        }
        throw new Error(`Ticketmaster API error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data._embedded?.events || data._embedded.events.length === 0) {
        break; // No more events
      }

      const processedEvents = data._embedded.events.map((event: TicketmasterEvent) => 
        processSingleEvent(event)
      );

      const filteredEvents = filterEvents(processedEvents);
      filteredCount += filteredEvents.length;
      
      const eventsToAdd = filteredEvents.slice(0, targetCount - allEvents.length);
      allEvents.push(...eventsToAdd);
      
      if (allEvents.length >= targetCount) {
        break;
      }
    } catch (error) {
      break;
    }
  }
  return {
    events: allEvents,
    filteredCount
  };
}

function filterEvents(processedEvents: any[]): any[] {
  const filteredEvents = processedEvents.filter((event: { has_price: any; has_image: any; startDate: string; }) => {
    return event.has_price && event.has_image && isUpcomingEvent(event.startDate);
  });

  return filteredEvents;
}

function processSingleEvent(ticketmasterEvent: TicketmasterEvent): any {
  // Ensure unique ID - use original Ticketmaster ID if available, otherwise generate one
  const eventId = ticketmasterEvent.id || generateUniqueId('tm');
  
  // Check for price information
  let hasPrice = false;
  let price = "N/A";
  let priceValue = 0.0;
  
  if (ticketmasterEvent.priceRanges?.[0]?.min !== undefined) {
    hasPrice = true;
    priceValue = ticketmasterEvent.priceRanges[0].min;
    price = `$${priceValue.toFixed(2)}`;
  }
  
  // Check for image
  let hasImage = false;
  let imageUrl = "https://via.placeholder.com/800x600?text=Event+Image";
  
  if (ticketmasterEvent.images?.length) {
    hasImage = true; 
    const suitableImages = ticketmasterEvent.images.filter(img => (img.width || 0) >= 400);
    if (suitableImages.length > 0) {
      imageUrl = suitableImages[0].url;
    } else {
      imageUrl = ticketmasterEvent.images[0].url;
    }
  }
  
  // Check for description
  let hasDescription = false;
  let description = "No description available for this event.";
  
  if (ticketmasterEvent.info && ticketmasterEvent.info.trim().length > 10) {
    hasDescription = true;
    description = ticketmasterEvent.info;
  } else if (ticketmasterEvent.pleaseNote && ticketmasterEvent.pleaseNote.trim().length > 10) {
    hasDescription = true;
    description = ticketmasterEvent.pleaseNote;
  } else if (ticketmasterEvent.description && ticketmasterEvent.description.trim().length > 10) {
    hasDescription = true;
    description = ticketmasterEvent.description;
  }
  
  // Extract venue info
  let venue = "Chicago, IL";
  if (ticketmasterEvent._embedded?.venues?.[0]) {
    const venueData = ticketmasterEvent._embedded.venues[0];
    const venueName = venueData.name || "";
    const city = venueData.city?.name || "Chicago";
    const state = venueData.state?.stateCode || "IL";
    venue = venueName ? `${venueName}, ${city}, ${state}` : `${city}, ${state}`;
  }
  
  // Extract date and time
  let startDate = "TBA";
  let startTime = "TBA";
  let endTime = "TBA";
  
  if (ticketmasterEvent.dates?.start) {
    if (ticketmasterEvent.dates.start.localDate) {
        startDate = dayjs(ticketmasterEvent.dates.start.localDate).format('YYYY-MM-DD');
    }
    
    if (ticketmasterEvent.dates.start.localTime) {
      startTime = ticketmasterEvent.dates.start.localTime;
      const [hour, minute] = startTime.split(':').map(Number);
      const endHour = (hour + 3) % 24;
      endTime = `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
    }
  }
  
  return {
    id: eventId,
    title: ticketmasterEvent.name,
    description,
    image: imageUrl,
    price,
    price_value: priceValue,
    location: venue,
    startDate,
    startTime,
    endTime,
    url: ticketmasterEvent.url || "",
    has_price: hasPrice,
    has_description: hasDescription,
    has_image: hasImage,
    source: 'ticketmaster'
  };
}