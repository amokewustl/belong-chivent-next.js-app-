import { NextRequest, NextResponse } from 'next/server';
import { TicketmasterEvent, ApiCacheEntry, Event } from '@/types';
import { dayjs, Dayjs, Chronos} from '@jstiava/chronos';
const chronos = new Chronos();


const TICKETMASTER_API_KEY = "pmbdy5uLSZnpbGGenJyLkA7xeRCPS20L";

// In-memory cache
let eventsCache: Record<string, ApiCacheEntry> = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetCount = parseInt(searchParams.get('targetCount') || '20');
  const maxPages = parseInt(searchParams.get('maxPages') || '5');
  const currentPage = parseInt(searchParams.get('page') || '0');

  console.log('API route called with params:', { targetCount, maxPages, currentPage });

  try {
    const cacheKey = `events_${targetCount}_${maxPages}_${currentPage}`;
    
    // Check cache first
    if (eventsCache[cacheKey]) {
      const cacheEntry = eventsCache[cacheKey];
      if (new Date() < cacheEntry.expiry) {
        console.log('Returning cached data');
        return NextResponse.json(cacheEntry.data);
      }
    }

    console.log('Cache miss, fetching from Ticketmaster...');
    
    // Fetch from Ticketmaster API
    const events = await fetchTicketmasterEvents(targetCount, maxPages, currentPage);
    
    // Cache the result
    eventsCache[cacheKey] = {
      data: events,
      expiry: dayjs().add(1, 'hour').toDate() 
    };

    console.log('Successfully fetched and cached events:', events.events.length);
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error in events API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function fetchTicketmasterEvents(
  targetCount: number, 
  maxPages: number, 
  currentPage: number
): Promise<{ events: Event[]; filteredCount: number }> {
  const allEvents: Event[] = [];
  let filteredCount = 0;
  
  console.log(`Fetching Ticketmaster events: targetCount=${targetCount}, maxPages=${maxPages}, startPage=${currentPage}`);
  
  for (let page = currentPage; page < currentPage + maxPages && allEvents.length < targetCount; page++) {
    console.log(`Fetching page ${page}...`);
    
    const url = 'https://app.ticketmaster.com/discovery/v2/events.json';
    const params = new URLSearchParams({
      apikey: TICKETMASTER_API_KEY,
      city: 'Chicago',
      stateCode: 'IL',
      size: '200',
      page: page.toString(),
      sort: 'date,asc'
    });

    try {
      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        console.error(`Ticketmaster API error for page ${page}:`, response.status, response.statusText);
        if (response.status === 401) {
          throw new Error('Invalid API key');
        }
        throw new Error(`Ticketmaster API error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Page ${page} response:`, data._embedded?.events?.length || 0, 'events');
      
      if (!data._embedded?.events || data._embedded.events.length === 0) {
        console.log(`No more events found at page ${page}`);
        break; // No more events
      }

      const processedEvents = data._embedded.events.map((event: TicketmasterEvent) => 
        processSingleEvent(event)
      );

      console.log(`Processed ${processedEvents.length} events from page ${page}`);

      const filteredEvents = filterEvents(processedEvents);

      filteredCount += filteredEvents.length;
      
      const eventsToAdd = filteredEvents.slice(0, targetCount - allEvents.length);
      allEvents.push(...eventsToAdd);
      
      console.log(`Total events collected so far: ${allEvents.length}`);
      
      if (allEvents.length >= targetCount) {
        break;
      }
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      throw error;
    }
  }

  console.log(`Final result: ${allEvents.length} events, ${filteredCount} total filtered`);
  
  return {
    events: allEvents,
    filteredCount
  };
}

function filterEvents(processedEvents: any[]): any[] {
  const filteredEvents = processedEvents.filter((event: { has_price: any; has_image: any; }) => {
    return event.has_price && event.has_image;
  });

  console.log(`Filtered to ${filteredEvents.length} events with price and image`);
  return filteredEvents;
}

function processSingleEvent(ticketmasterEvent: TicketmasterEvent): Event {
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
    id: ticketmasterEvent.id,
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
    has_image: hasImage
  };
}