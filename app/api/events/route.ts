import { NextRequest, NextResponse } from 'next/server';
import { TicketmasterEvent, ApiCacheEntry } from '@/types';
import { dayjs, Dayjs, Chronos} from '@jstiava/chronos';
import { generateUniqueId } from '@/utils/idUtils';
import connectDB from '@/lib/mongodb';
import Event, {IEvent} from '@/models/event';
import { ObjectId } from 'mongodb';
import { convertToMongoEvent } from '@/lib/misc';
const chronos = new Chronos();
import Mongo from '@/lib/mongodb';

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
    try{
      const events = await fetchTicketmasterEvents(targetCount, maxPages, currentPage);
      if (!events){
        console.error('Error no events');
        return NextResponse.json(
          { error: 'Failed to fetch events' },
          { status: 500 }
        );
      }
      
      //const newEvnts = []
      // convertToMongoEvent function
      // await connectDB()
      // for( const event of events.events){
      //   const rawEvent = convertToMongoEvent(event)
      //   newEvnts.push(rawEvent)
      //   //const newEvent = new Event(rawEvent);
      //   // console.log(newEvent);
      //   await rawEvent.save();
      // }

      const mongo = await Mongo.getInstance();
      await mongo.clientPromise.db('test').collection('events-test').deleteMany({});
            await mongo.clientPromise.db('test').collection('events-test').insertMany(
              events.events.map(event => convertToMongoEvent(event))
            )
            //const newEvnts = await mongo.clientPromise.db('test').collection('events-test').find({}).toArray()
      return NextResponse.json({events: newEvnts});
      console.log('Successfully fetched and cached events:', events.events.length);
    }catch(errror){
      console.log(errror)
      return NextResponse.json(
        { error: 'fetch ticketmaster failed', errror },
        { status: 500 }
      );
    }
    
    
    
    //Cache the result
    // eventsCache[cacheKey] = {
    //   data: events,
    //   expiry: dayjs().add(1, 'hour').toDate() 
    // };

    
  } catch (error) {
    console.error('Error in events API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
const testEvent = {
  name: 'Parade Pass',
  type: 'event',
  id: 'Za5ju3rKuqZDeaE9_IQgPvEbeBnQKFVOSl',
  test: false,
  locale: 'en-us',
  images: [
    {
      ratio: '16_9',
      url: 'https://s1.ticketm.net/dam/c/8cf/a6653880-7899-4f67-8067-1f95f4d158cf_124761_RETINA_LANDSCAPE_16_9.jpg',
      width: 1136,
      height: 639,
      fallback: true
    },
    {
      ratio: '16_9',
      url: 'https://s1.ticketm.net/dam/c/8cf/a6653880-7899-4f67-8067-1f95f4d158cf_124761_RETINA_PORTRAIT_16_9.jpg',
      width: 640,
      height: 360,
      fallback: true
    },
    {
      ratio: '16_9',
      url: 'https://s1.ticketm.net/dam/c/8cf/a6653880-7899-4f67-8067-1f95f4d158cf_124761_RECOMENDATION_16_9.jpg',
      width: 100,
      height: 56,
      fallback: true
    },
    {
      ratio: '16_9',
      url: 'https://s1.ticketm.net/dam/c/8cf/a6653880-7899-4f67-8067-1f95f4d158cf_124761_TABLET_LANDSCAPE_LARGE_16_9.jpg',
      width: 2048,
      height: 1152,
      fallback: true
    },
    {
      ratio: '3_2',
      url: 'https://s1.ticketm.net/dam/c/8cf/a6653880-7899-4f67-8067-1f95f4d158cf_124761_ARTIST_PAGE_3_2.jpg',
      width: 305,
      height: 203,
      fallback: true
    },
    {
      ratio: '4_3',
      url: 'https://s1.ticketm.net/dam/c/8cf/a6653880-7899-4f67-8067-1f95f4d158cf_124761_CUSTOM.jpg',
      width: 305,
      height: 225,
      fallback: true
    },
    {
      ratio: '3_2',
      url: 'https://s1.ticketm.net/dam/c/8cf/a6653880-7899-4f67-8067-1f95f4d158cf_124761_TABLET_LANDSCAPE_3_2.jpg',
      width: 1024,
      height: 683,
      fallback: true
    },
    {
      ratio: '16_9',
      url: 'https://s1.ticketm.net/dam/c/8cf/a6653880-7899-4f67-8067-1f95f4d158cf_124761_TABLET_LANDSCAPE_16_9.jpg',
      width: 1024,
      height: 576,
      fallback: true
    },
    {
      ratio: '3_2',
      url: 'https://s1.ticketm.net/dam/c/8cf/a6653880-7899-4f67-8067-1f95f4d158cf_124761_RETINA_PORTRAIT_3_2.jpg',
      width: 640,
      height: 427,
      fallback: true
    },
    {
      ratio: '16_9',
      url: 'https://s1.ticketm.net/dam/c/8cf/a6653880-7899-4f67-8067-1f95f4d158cf_124761_EVENT_DETAIL_PAGE_16_9.jpg',
      width: 205,
      height: 115,
      fallback: true
    }
  ],
  dates: {
    start: {
      localDate: '2025-07-13',
      localTime: '13:10:00',
      dateTime: '2025-07-13T18:10:00Z',
      dateTBD: false,
      dateTBA: false,
      timeTBA: false,
      noSpecificTime: false
    },
    end: {
      localDate: '2025-07-13',
      localTime: '17:10:00',
      dateTime: '2025-07-13T22:10:00Z',
      approximate: false,
      noSpecificTime: false
    },
    timezone: 'America/Chicago',
    status: { code: 'offsale' },
    spanMultipleDays: false
  },
  ticketing: { safeTix: { enabled: false }, id: 'ticketing' },
  _links: {
    self: {
      href: '/discovery/v2/events/Za5ju3rKuqZDeaE9_IQgPvEbeBnQKFVOSl?locale=en-us'
    },
    venues: [ [Object] ] //dont bring into mongo
  },
  _embedded: { venues: [ [Object] ] }  //dont bring into mongo
}
type TestType = typeof testEvent;

// function convertToMongoEvent(target : TestType): Omit<IEvent, keyof Document>{
//   return {
//     title: target.name,
//     description:  target.description || "No description provided.",
//     organizer: new ObjectId(target.id), 
//     venue: {
//       name: "Unknown Venue",
//       address: {
//         street: "Unknown",
//         city: "Chicago",
//         state: "IL",
//         zipCode: "Unkown",
//         country: "USA"
//       },
//       capacity: undefined
//     },
//     dateTime: {
//       start: new Date(target.dates.start.localDate),
//       end: new Date(target.dates.end.localDate)
//     },
//     ticketOptions: [] ,
//     category: "other",
//     status: "published",
//     images: target.images?.map(img => ({
//       url: img.url,
//       alt: `${target.name} image`
//       })),
//     tags: ["AI", "neww", "Startups", "Networking"],
//     createdAt: new Date(),
//     updatedAt: new Date()
//   };
//  }
export async function fetchTicketmasterEvents(
  targetCount: number, 
  maxPages: number, 
  currentPage: number
): Promise<{ events: TestType[]; filteredCount: number }> {
  const allEvents: TestType[] = [];
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
    // _id: eventId,
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