import { NextResponse } from 'next/server';
import { fetchAnalytics, parsePeriod } from '@/lib/analytics';

export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = parsePeriod(searchParams.get('period'));
  const data = await fetchAnalytics(period);
  const bothMissing = !data.ga4 && !data.gsc;
  return NextResponse.json(data, { status: bothMissing ? 503 : 200 });
}
