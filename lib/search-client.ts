export interface SearchSuggestion {
    text: string;
    type: 'event' | 'category' | 'venue' | 'tag';
  }
  
  export interface SearchOptions {
    query?: string;
    genre?: string;
    limit?: number;
    skip?: number;
  }
  
  export interface SearchResult {
    events: any[];
    total: number;
    hasMore: boolean;
    debug?: any;
  }
  
  export async function searchEvents(options: SearchOptions): Promise<SearchResult> {
    const { query = '', genre = '', limit = 20, skip = 0 } = options;
    
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (genre) params.append('genre', genre);
      params.append('limit', limit.toString());
      params.append('skip', skip.toString());
  
      const response = await fetch(`/api/search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errorMessage || `Search request failed: ${response.status}`);
      }
      const result = await response.json();
      console.log('Client: Search completed:', {
        eventsFound: result.events?.length || 0,
        total: result.total || 0,
        hasMore: result.hasMore || false
      });
      return result;
    } catch (error) {
      console.error('Client: Search error:', error);
      throw error;
    }
  }
  
  export async function getSearchSuggestions(query: string, limit: number = 8): Promise<SearchSuggestion[]> {
    if (!query.trim() || query.length < 2) {
      return [];
    }
  
    try {
      const result = await searchEvents({ query, limit: 20 });
      const suggestions: SearchSuggestion[] = [];
      const added = new Set<string>();
  
      result.events.forEach(event => {
        if (event.title && event.title.toLowerCase().includes(query.toLowerCase()) && !added.has(event.title.toLowerCase()) && suggestions.length < limit) {
          suggestions.push({ text: event.title, type: 'event' });
          added.add(event.title.toLowerCase());
        }
      });
      return suggestions;
    } catch (error) {
      console.error(' Client: Suggestions error:', error);
      return [];
    }
  }
  
  export async function getAvailableGenres(): Promise<string[]> {
    try {
      return [
        'Concert', 'Comedy', 'Theater', 'Sports', 'Festival', 
        'Conference', 'Workshop', 'Networking', 'Art', 'Music', 
        'Dance', 'Food', 'Technology', 'Business', 'Health', 
        'Education', 'Family', 'Entertainment'
      ];
  
    } catch (error) {
      console.error(' Client: Error fetching genres:', error);
      return [];
    }
  }
  
  export async function forceDatabaseSync(): Promise<boolean> {
    try {
      const response = await fetch('/api/events?refresh=true&targetCount=50', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`Sync request failed: ${response.status}`);
      }
      const result = await response.json();
      console.log('Client: Database sync completed:', {
        eventsSynced: result.events?.length || 0,
        synced: result.synced || false
      });
      return result.synced || false;
    } catch (error) {
      console.error('Client: Sync error:', error);
      return false;
    }
  }
  