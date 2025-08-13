import { ObjectId } from 'mongodb';

export interface Event {
  id: string;
  _id?: string;
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  price: string;
  price_value: number;
  location: string;
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  url: string;
  has_price: boolean;
  has_description: boolean;
  has_image: boolean;
  source?: 'custom' | 'ticketmaster'; 
  ticketmasterId?: string; 
}

export interface MongoEvent {
  _id?: ObjectId;
  id?: string; 
  title: string;
  description?: string;
  organizer?: ObjectId;
  venue?: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    capacity?: number;
  };
  dateTime?: {
    start: Date;
    end: Date;
  };
  ticketOptions?: Array<{
    name: string;
    description: string;
    price: number;
    totalQuantity: number;
    soldQuantity: number;
    status: string;
  }>;
  category?: string;
  status?: string;
  tags?: string[];
  images?: string[];
  url?: string;
  
  // Flat fields for easier querying and compatibility
  location?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  price?: string;
  price_value?: number;
  image?: string;
  has_price?: boolean;
  has_image?: boolean;
  has_description?: boolean;
  
  createdAt?: Date;
  updatedAt?: Date;
  source?: 'custom' | 'ticketmaster';
  ticketmasterId?: string;
}
  
export interface CartItem {
  event_id: string;
  title: string;
  price: string;
  price_value: number;
  quantity: number;
}
  
export interface ApiCacheEntry {
  data: {
    events: Event[];
    filteredCount: number;
  };
  expiry: Date;
}

export interface TicketmasterResponse {
  _embedded?: {
    events: any[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface TicketmasterEvent {
  name: string;
  id: string;
  description?: string;
  info?: string;
  pleaseNote?: string;
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  dates: {
    start: {
      localDate: string;
      localTime: string;
      dateTime: string;
      dateTBD: boolean;
      dateTBA: boolean;
      timeTBA: boolean;
      noSpecificTime: boolean;
    };
    end?: {
      localDate: string;
      localTime: string;
      dateTime: string;
      approximate: boolean;
      noSpecificTime: boolean;
    };
    timezone: string;
    status: { code: string };
    spanMultipleDays: boolean;
  };
  classifications?: Array<{
    primary: boolean;
    segment: {
      id: string;
      name: string;
    };
    genre: {
      id: string;
      name: string;
    };
    subGenre: {
      id: string;
      name: string;
    };
    type: {
      id: string;
      name: string;
    };
    subType: {
      id: string;
      name: string;
    };
    family: boolean;
  }>;
  images?: Array<{
    ratio: string;
    url: string;
    width: number;
    height: number;
    fallback?: boolean;
  }>;
  _embedded?: {
    venues?: Array<{
      name: string;
      address?: {
        line1: string;
        line2?: string;
      };
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
      postalCode: string;
    }> | any; 
  };
  _links?: any;
  ticketing?: any;
  url?: string;
  [key: string]: any;
}

export interface SavedEvent {
  eventId: string;
  eventTitle: string;
  savedAt: Date;
}

export interface User {
  _id: ObjectId;
  savedEvents?: SavedEvent[];
  email?: string;
  username?: string;
  [key: string]: any; 
}