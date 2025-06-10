
import { Event } from '@/types';

export const fetchEnoughEvents = async (
  targetCount: number = 20, 
  maxPages: number = 5, 
  currentPage: number = 0
): Promise<{ events: Event[]; filteredCount: number }> => {
  try {
    const params = new URLSearchParams({
      targetCount: targetCount.toString(),
      maxPages: maxPages.toString(),
      page: currentPage.toString()
    });

    console.log('Fetching events with URL:', `/api/events?${params}`);
    
    const response = await fetch(`/api/events?${params}`);
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      // Try to get the error details from the response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.text();
        console.error('Error response body:', errorData);
        errorMessage += ` - ${errorData}`;
      } catch (e) {
        console.error('Could not read error response body');
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Successfully fetched events:', data);
    return data;
  } catch (error) {
    console.error("Error fetching events:", error);
    
    }
    
    return { events: [], filteredCount: 0 };
  };