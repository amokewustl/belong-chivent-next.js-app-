import { NextRequest, NextResponse } from 'next/server';
import { getSearchSuggestions } from '@/lib/search';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '8');

    if (!query.trim() || query.length < 2) {
      return NextResponse.json([]);
    }

    const suggestions = await getSearchSuggestions(query, limit);
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}