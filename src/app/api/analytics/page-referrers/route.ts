import { NextResponse } from 'next/server';
import { fetchPageReferrers, parsePeriod } from '@/lib/analytics';

export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  const period = parsePeriod(searchParams.get('period'));
  if (!path) {
    return NextResponse.json(
      { error: 'path query param required' },
      { status: 400 },
    );
  }
  const data = await fetchPageReferrers(path, period);
  return NextResponse.json(data);
}
