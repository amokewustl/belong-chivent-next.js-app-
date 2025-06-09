
export interface EventStats {
    totalEvents: number;
    avgPrice: number;
    eventsWithImages: number;
    eventsWithPrices: number;
    popularVenues: Array<{
      venue: string;
      count: number;
    }>;
    priceDistribution: Array<{
      range: string;
      count: number;
    }>;
  }
  
  export interface AdminUser {
    id: string;
    username: string;
    role: 'admin' | 'super_admin';
    lastLogin: Date;
  }
  
  export interface AdminLog {
    id: string;
    action: string;
    userId: string;
    timestamp: Date;
    details: string;
  }