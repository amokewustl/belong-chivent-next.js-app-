
const TICKETMASTER_API_KEY = "pmbdy5uLSZnpbGGenJyLkA7xeRCPS20L";
import axios from 'axios'
import { ObjectId } from 'mongodb';
import Event, {IEvent} from '@/models/event';
import { TicketmasterEvent } from '@/types';
import { Description } from '@mui/icons-material';

export async function fetchTicketmasterEvents(
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
  
        const response = await axios.get(`${url}?${params}`);
        return response.data
        
        // if (!response.data) {
        //   console.error(`Ticketmaster API error for page ${page}:`, response.status, response.statusText);
        //   if (response.status === 401) {
        //     throw new Error('Invalid API key');
        //   }
        //   throw new Error(`Ticketmaster API error! status: ${response.status}`);
        // }
  
        // const data = await response.;
        // console.log(`Page ${page} response:`, data._embedded?.events?.length || 0, 'events');
        
        // if (!data._embedded?.events || data._embedded.events.length === 0) {
        //   console.log(`No more events found at page ${page}`);
        //   break; // No more events
        // }
  
        // const processedEvents = data._embedded.events.map((event: TicketmasterEvent) => 
        //   processSingleEvent(event)
        // );
  
        // console.log(`Processed ${processedEvents.length} events from page ${page}`);
  
        // const filteredEvents = filterEvents(processedEvents);
  
        // filteredCount += filteredEvents.length;
        
        // const eventsToAdd = filteredEvents.slice(0, targetCount - allEvents.length);
        // allEvents.push(...eventsToAdd);
        
        // console.log(`Total events collected so far: ${allEvents.length}`);
        
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
  type TestType = typeof testEvent & { description?: string};


// interface DateTimeFields {
//     start_date: Date;
//     end_date: Date;
//     start_time: Date;
//     end_time: Date;
//     timezone: string;
//     }

interface DateTimeFields {
    start: Date;
    end: Date;
    }
export function extractDateTimeFields(event: TicketmasterEvent) {
  let startDateTime = null
  let endDateTime = null
  if (event.dates && event.dates.start){    
    startDateTime = new Date(event.dates.start.dateTime);
  }
  if (event.dates && event.dates.end ){
    endDateTime = event.dates.end ? new Date(event.dates.end.dateTime): startDateTime;
  }
  
  return {
    start: startDateTime,
    end: endDateTime
  };
    }

export function extractCategory(event: TicketmasterEvent): string {
    if (!event.classifications || event.classifications.length === 0) {
        return "other";
      }
      const primaryClassification = event.classifications.find(c => c.primary) || event.classifications[0];
      const segment = primaryClassification.segment.name.toLowerCase();
      const genre = primaryClassification.genre.name.toLowerCase();
      
      if (segment.includes('music') || genre.includes('music')) {
        return "music";
      } else if (segment.includes('sports')) {
        return "sports";
      } else if (segment.includes('arts') || segment.includes('theatre') || genre.includes('comedy')) {
        return "arts";
      } else if (segment.includes('business') || genre.includes('business')) {
        return "business";
      } else if (segment.includes('food') || genre.includes('food')) {
        return "food";
      } else if (segment.includes('technology') || genre.includes('tech')) {
        return "technology";
      } else if (segment.includes('education') || genre.includes('education')) {
        return "education";
      } else {
        return "other";
      }
    }

export function extractVenueInfo(event: TicketmasterEvent) {
    const venue = event._embedded?.venues?.[0];
    
    if (!venue) {
      return {
        name: "Unknown Venue",
        address: {
          street: "Unknown",
          city: "Chicago",
          state: "IL",
          zipCode: "Unknown",
          country: "USA"
        },
        capacity: undefined
      };
    }
    
    return {
      name: venue.name,
      address: {
        street: venue.address?.line1 || "Unknown",
        city: venue.city.name,
        state: venue.state.stateCode,
        zipCode: venue.postalCode,
        country: venue.country.countryCode
      },
      capacity: undefined
    };
  }



export function convertToMongoEvent(target : TestType){
  const dateTimeFields = extractDateTimeFields(target);
  const category = extractCategory(target);
  const venue = extractVenueInfo(target);
  
  return {
    title: target.name, // title coming out as null
    description: target.description || "No description provided.",
    organizer: target.id,
    venue: venue,
    dateTime: dateTimeFields,
    ticketOptions: [],
    category: category,
    status: "published",
    images: target.images?.map(img => ({ // fix images
      url: img.url,
      alt: `${target.name} image`
    })) || [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
   }