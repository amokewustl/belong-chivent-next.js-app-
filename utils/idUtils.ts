import { v4 as uuidv4 } from 'uuid';

export function generateUniqueId(prefix: string = 'custom'): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomPart}`;
}

export function isCustomEvent(eventId: string): boolean {
  return eventId.startsWith('custom-');
}

export function isTicketmasterEvent(eventId: string): boolean {
  return eventId.startsWith('tm-') || eventId.startsWith('vvG1');
}