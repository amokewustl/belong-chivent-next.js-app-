
export interface Event {
  id: string;
  title: string;
  description: string;
  image: string;
  price: string;
  price_value: number;
  location: string;
  startDate: string;
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
  data: any;
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
  info?: string;
  pleaseNote?: string;
  description?: string;
  url?: string;
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
    };
  };
  priceRanges?: Array<{
    min?: number;
    max?: number;
  }>;
  images?: Array<{
    url: string;
    width?: number;
    height?: number;
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