import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Event from '@/models/event';
import User from '@/models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'random-string';
const TICKETMASTER_API_KEY = "pmbdy5uLSZnpbGGenJyLkA7xeRCPS20L";

interface TicketmasterEvent {
  id: string;
  name: string;
  info?: string;
  pleaseNote?: string;
  description?: string;
  url: string;
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
    end?: {
      localDate: string;
      localTime?: string;
    };
  };
  _embedded?: {
    venues: Array<{
      name: string;
      city: {
        name: string;
      };
      state: {
        name: string;
        stateCode: string;
      };
      country: {
        name: string;
        countryCode: string;
      };
      address?: {
        line1: string;
      };
      postalCode?: string;
    }>;
  };
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  classifications?: Array<{
    segment: {
      name: string;
    };
    genre: {
      name: string;
    };
    subGenre: {
      name: string;
    };
  }>;
}

function convertTicketmasterEvent(tmEvent: TicketmasterEvent, organizerId: string): any {
  const venue = tmEvent._embedded?.venues?.[0];
  const priceRange = tmEvent.priceRanges?.[0];
  
  // Parse dates and times
  const startDate = tmEvent.dates.start.localDate;
  const startTime = tmEvent.dates.start.localTime || '00:00:00';
  const endTime = tmEvent.dates.end?.localTime || (() => {
    if (tmEvent.dates.start.localTime) {
      const [hour, minute] = tmEvent.dates.start.localTime.split(':').map(Number);
      const endHour = (hour + 3) % 24;
      return `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
    }
    return '23:59:59';
  })();

  // image
  const image = tmEvent.images
    ?.filter(img => img.width >= 400)
    ?.sort((a, b) => (b.width * b.height) - (a.width * a.height))?.[0]
    || tmEvent.images?.[0];

  // Get description
  let description = "No description available for this event.";
  if (tmEvent.info && tmEvent.info.trim().length > 10) {
    description = tmEvent.info;
  } else if (tmEvent.pleaseNote && tmEvent.pleaseNote.trim().length > 10) {
    description = tmEvent.pleaseNote;
  } else if (tmEvent.description && tmEvent.description.trim().length > 10) {
    description = tmEvent.description;
  }

  // Build location string
  let location = "Chicago, IL";
  if (venue) {
    const venueName = venue.name || "";
    const city = venue.city?.name || "Chicago";
    const state = venue.state?.stateCode || "IL";
    location = venueName ? `${venueName}, ${city}, ${state}` : `${city}, ${state}`;
  }

  return {
    title: tmEvent.name,
    description,
    image: image?.url || "https://via.placeholder.com/800x600?text=Event+Image",
    price: priceRange ? `$${priceRange.min.toFixed(2)}` : "N/A",
    price_value: priceRange?.min || 0,
    location,
    startDate,
    startTime,
    endTime,
    url: tmEvent.url || "",
    has_price: !!priceRange,
    has_description: description !== "No description available for this event.",
    has_image: !!image,
    // Store original Ticketmaster data for reference
    externalId: tmEvent.id,
    externalSource: 'ticketmaster',
    source: 'ticketmaster',
    createdBy: organizerId
  };
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    console.log("hi");
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

    const { city = 'Chicago', size = 50, page = 0 } = await request.json();
    
    // Fetch events from Ticketmaster
    const url = 'https://app.ticketmaster.com/discovery/v2/events.json';
    const params = new URLSearchParams({
      apikey: TICKETMASTER_API_KEY,
      city: city,
      stateCode: 'IL',
      size: size.toString(),
      page: page.toString(),
      sort: 'date,asc'
    });

    const tmResponse = await fetch(`${url}?${params}`);

    if (!tmResponse.ok) {
      throw new Error(`Ticketmaster API error: ${tmResponse.status}`);
    }

    const tmData = await tmResponse.json();
    const tmEvents = tmData._embedded?.events || [];

    if (tmEvents.length === 0) {
      return NextResponse.json({ 
        message: 'No events found from Ticketmaster',
        synced: 0,
        skipped: 0,
        totalProcessed: 0
      });
    }

    let syncedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Process each event
    for (const tmEvent of tmEvents) {
      try {
        // Check if event already exists
        const existingEvent = await Event.findOne({ 
          externalId: tmEvent.id
        });

        if (existingEvent) {
          skippedCount++;
          continue;
        }

        // Convert and save event
        const eventData = convertTicketmasterEvent(tmEvent, user._id.toString());
        const newEvent = new Event(eventData);
        await newEvent.save();
        syncedCount++;

      } catch (error) {
        console.error(`Error processing event ${tmEvent.id}:`, error);
        errors.push(`Event ${tmEvent.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      message: `Sync completed: ${syncedCount} events added, ${skippedCount} skipped`,
      synced: syncedCount,
      skipped: skippedCount,
      totalProcessed: tmEvents.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync Ticketmaster events', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}