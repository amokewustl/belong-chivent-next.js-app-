import connectDB from '@/lib/mongodb';
import Event from '@/models/event';
import {fetchTicketmasterEvents, convertToMongoEvent} from './lib/misc';
import '@testing-library/jest-dom';
import axios from 'axios'

test('fetch events from mongodb', async () => {
  await connectDB();
  try {
    const events = await Event.find({}, { title: 1, _id: 1 });
    
    // console.log('Found events:', events);
    // console.log('Number of events:', events.length);
    
    events.forEach((event) => {
      console.log(`Event Title: ${event.title}, ID: ${event._id}`);
    });
    
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
});
test('fetch ticketmaster events', async () => {
    const targetCount =1
    const maxPages =1
    const currentPage = 1
    const num = 1
    const events = await fetchTicketmasterEvents(targetCount, maxPages, currentPage);
    
    //         const firstEvent = events[0];
    //         console.log('First event:', firstEvent);
    //       }
    // //}

    const target = events._embedded.events.find(x => x.name == 'Wood Delaine, Shafia Cleveland, Noe Noel, Sir Trey, Larro the Comedian')
    console.log(JSON.stringify(target, null, 2))
})

test ('testEvent ', async () => {
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
      console.log(convertToMongoEvent(testEvent))
})