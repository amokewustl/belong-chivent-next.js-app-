import Mongo from '@/lib/mongodb';
import { Event, MongoEvent } from '@/types';
import { Document } from 'mongodb';

export interface SearchOptions {
  query?: string;
  genre?: string;
  limit?: number;
  skip?: number;
}

export interface SearchResult {
  events: Event[];
  total: number;
  hasMore: boolean;
}

export interface SearchSuggestion {
  text: string;
  type: 'event' | 'category' | 'venue' | 'tag';
}


const transformMongoEvent = (event: Document): Event => {
  const mongoEvent = event as any; 
  return {
    id: mongoEvent.id || mongoEvent._id?.toString() || '',
    title: mongoEvent.title || mongoEvent.name || '',
    description: mongoEvent.description || mongoEvent.info || mongoEvent.pleaseNote || '',
    location: mongoEvent.venue ? 
      `${mongoEvent.venue.name || ''}, ${mongoEvent.venue.address?.city || ''}, ${mongoEvent.venue.address?.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '') :
      mongoEvent.location || 'Location TBA',
    startDate: mongoEvent.dateTime?.start ? 
      new Date(mongoEvent.dateTime.start).toISOString().split('T')[0] : 
      mongoEvent.startDate || 'TBA',
    endDate: mongoEvent.dateTime?.end ? 
      new Date(mongoEvent.dateTime.end).toISOString().split('T')[0] : 
      mongoEvent.endDate || '',
    startTime: mongoEvent.dateTime?.start ? 
      new Date(mongoEvent.dateTime.start).toTimeString().split(' ')[0] : 
      mongoEvent.startTime || 'TBA',
    endTime: mongoEvent.dateTime?.end ? 
      new Date(mongoEvent.dateTime.end).toTimeString().split(' ')[0] : 
      mongoEvent.endTime || 'TBA',
    price: mongoEvent.ticketOptions && mongoEvent.ticketOptions.length > 0 ? 
      `$${mongoEvent.ticketOptions[0].price}` : 
      mongoEvent.price || 'N/A',
    price_value: mongoEvent.ticketOptions && mongoEvent.ticketOptions.length > 0 ? 
      mongoEvent.ticketOptions[0].price : 
      mongoEvent.price_value || 0,
    image: (() => {
      if (mongoEvent.images && mongoEvent.images.length > 0) {
        const firstImage = mongoEvent.images[0];
        if (typeof firstImage === 'string') {
          return firstImage;
        } else if (typeof firstImage === 'object' && firstImage !== null) {
          return (firstImage as any).url || firstImage;
        }
      }
      return mongoEvent.image || 'https://via.placeholder.com/800x600?text=Event+Image';
    })(),
    has_price: (mongoEvent.ticketOptions && mongoEvent.ticketOptions.length > 0 && mongoEvent.ticketOptions[0].price > 0) || 
               (mongoEvent.has_price !== undefined ? mongoEvent.has_price : false),
    has_image: (mongoEvent.images && mongoEvent.images.length > 0) || 
               (mongoEvent.has_image !== undefined ? mongoEvent.has_image : false),
    has_description: !!mongoEvent.description || 
                     (mongoEvent.has_description !== undefined ? mongoEvent.has_description : false),
    url: mongoEvent.url || '',
    source: mongoEvent.source || 'custom',
    ticketmasterId: mongoEvent.ticketmasterId || mongoEvent.id || undefined,
  };
};

const filterUpcomingEvents = (events: Event[]): Event[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return events.filter((event) => {
    if (event.startDate === 'TBA' || !event.startDate) {
      return true;
    }
    try {
      const eventDate = new Date(event.startDate);
      return eventDate >= today;
    } catch (error) {
      console.warn(`Invalid date format for event ${event.id}: ${event.startDate}`);
      return true;
    }
  });
};

export async function searchEvents(options: SearchOptions): Promise<SearchResult> {
  const { query = '', genre = '', limit = 20, skip = 0 } = options;

  if (!query.trim() && !genre.trim()) {
    return { events: [], total: 0, hasMore: false };
  }

  try {
    const mongo = await Mongo.getInstance();
    const db = mongo.clientPromise.db('test');
    const collection = db.collection('events');
    const totalEvents = await collection.countDocuments();
    
    if (totalEvents === 0) {
      return { events: [], total: 0, hasMore: false };
    }
    const pipeline: any[] = [];
    const searchConditions: any = {};

    if (query.trim()) {
      const searchPattern = query.trim();
      const searchRegex = new RegExp(searchPattern, 'i');
      
      searchConditions.$or = [
        { title: searchRegex },
        { name: searchRegex }, 
        { description: searchRegex },
        { info: searchRegex },
        { pleaseNote: searchRegex },
        { 'venue.name': searchRegex },
        { location: searchRegex },
        { category: searchRegex },
        { tags: searchRegex },
        { tags: { $in: [searchRegex] } }, 
      ];
    }

    if (genre.trim()) {
      const genreRegex = new RegExp(genre.trim(), 'i');
      if (searchConditions.$or) {
        searchConditions.$and = [
          { $or: searchConditions.$or },
          {
            $or: [
              { category: genreRegex },
              { tags: genreRegex },
              { tags: { $in: [genreRegex] } }
            ]
          }
        ];
        delete searchConditions.$or;
      } else {
        searchConditions.$or = [
          { category: genreRegex },
          { tags: genreRegex },
          { tags: { $in: [genreRegex] } }
        ];
      }
    }

    pipeline.push({ $match: searchConditions });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    pipeline.push({
      $match: {
        $or: [
          { 'dateTime.start': { $gte: today } },
          { 'dates.start.dateTime': { $gte: today } }, 
          { startDate: 'TBA' },
          { startDate: { $exists: false } },
          { startDate: { $gte: today.toISOString().split('T')[0] } },
          { 
            $and: [
              { 'dateTime.start': { $exists: false } },
              { 'dates.start.dateTime': { $exists: false } },
              { startDate: { $exists: false } }
            ]
          }
        ]
      }
    });

    pipeline.push({
      $sort: {
        'dateTime.start': 1,
        'dates.start.dateTime': 1,
        startDate: 1,
        title: 1,
        name: 1
      }
    });

    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await collection.aggregate(countPipeline).toArray();
    const total = countResult[0]?.total || 0;
    
    if (total === 0) {
      const simpleSearch = await collection.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { name: { $regex: query, $options: 'i' } }
        ]
      }).limit(5).toArray();
      console.log('Simple search results:', simpleSearch.length);
    }

    if (skip > 0) {
      pipeline.push({ $skip: skip });
    }
    pipeline.push({ $limit: limit });
    const results = await collection.aggregate(pipeline).toArray();
    console.log('Raw search results:', results.length);
    const transformedEvents = results.map(transformMongoEvent);
    console.log('Transformed events:', transformedEvents.length);
    const upcomingEvents = filterUpcomingEvents(transformedEvents);
    console.log('Final upcoming events:', upcomingEvents.length);

    return {
      events: upcomingEvents,
      total,
      hasMore: skip + limit < total
    };

  } catch (error) {
    console.error('Search error:', error);
    throw new Error('Search failed');
  }
}

// Get search suggestions - SIMPLIFIED VERSION
export async function getSearchSuggestions(query: string, limit: number = 8): Promise<SearchSuggestion[]> {
  if (!query.trim() || query.length < 2) {
    return [];
  }

  try {
    const mongo = await Mongo.getInstance();
    const db = mongo.clientPromise.db('test');
    const collection = db.collection('events');
    const searchRegex = new RegExp(query, 'i');
    const results = await collection.find({
      $or: [
        { title: searchRegex },
        { name: searchRegex },
        { category: searchRegex },
        { 'venue.name': searchRegex },
        { tags: searchRegex }
      ]
    }).limit(20).toArray();

    const suggestions: SearchSuggestion[] = [];
    const added = new Set<string>();

    results.forEach(event => {
      const title = event.title || event.name;
      if (title && title.toLowerCase().includes(query.toLowerCase()) && !added.has(title.toLowerCase())) {
        suggestions.push({ text: title, type: 'event' });
        added.add(title.toLowerCase());
      }
      if (event.category && event.category.toLowerCase().includes(query.toLowerCase()) && !added.has(event.category.toLowerCase())) {
        suggestions.push({ text: event.category, type: 'category' });
        added.add(event.category.toLowerCase());
      }
      if (event.venue?.name && event.venue.name.toLowerCase().includes(query.toLowerCase()) && !added.has(event.venue.name.toLowerCase())) {
        suggestions.push({ text: event.venue.name, type: 'venue' });
        added.add(event.venue.name.toLowerCase());
      }
    });
    return suggestions.slice(0, limit);
  } catch (error) {
    console.error('Suggestions error:', error);
    return [];
  }
}

export async function getAvailableGenres(): Promise<string[]> {
  try {
    const mongo = await Mongo.getInstance();
    const db = mongo.clientPromise.db('test');
    const collection = db.collection('events');
    const categories = await collection.distinct('category');
    const tags = await collection.distinct('tags');
    const allGenres = [...new Set([...categories, ...tags.flat()])]
      .filter(genre => typeof genre === 'string' && genre.trim() !== '')
      .sort();

    return allGenres;

  } catch (error) {
    console.error('Error fetching genres:', error);
    return [
      'Concert', 'Comedy', 'Theater', 'Sports', 'Festival', 'Conference',
      'Workshop', 'Networking', 'Art', 'Music', 'Dance', 'Food',
      'Technology', 'Business', 'Health', 'Education', 'Family'
    ];
  }
}