
export const formatDate = (dateStr: string): string => {
    if (dateStr === "TBA") {
      return "TBA";
    }
    try {
      const dateObj = new Date(dateStr);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };
  
  export const formatTime = (timeStr: string): string => {
    if (timeStr === "TBA") {
      return "TBA";
    }
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeStr;
    }
  };
  
  export const truncateDescription = (description: string, maxLength: number = 100): string => {
    if (description.length <= maxLength) {
      return description;
    }
    return description.substring(0, maxLength) + "...";
  };