import { NextRequest, NextResponse } from 'next/server';
import { getAvailableGenres } from '@/lib/search';

export async function GET(request: NextRequest) {
  try {
    const genres = await getAvailableGenres();
    return NextResponse.json(genres);
  } catch (error) {
    console.error('Genres API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}