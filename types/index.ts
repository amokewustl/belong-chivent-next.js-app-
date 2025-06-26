
export interface Event {
  id: string;
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
  id: string;
  name: string;
  description?: string;
  info?: string;
  pleaseNote?: string;
  url?: string;
  images?: Array<{
    url: string;
    width?: number;
    height?: number;
  }>;
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
    };
  };
  priceRanges?: Array<{
    min: number;
    max: number;
  }>;
  _embedded?: {
    venues?: Array<{
      name?: string;
      city?: {
        name?: string;
      };
      state?: {
        stateCode?: string;
      };
    }>;
  };
}
