import { getGa4Client, getGa4PropertyId } from './ga4';
import { getGscClient, getGscSiteUrl } from './gsc';

export type Period = '7d' | '30d' | '90d';

export type Ga4Summary = {
  users: number;
  sessions: number;
  pageViews: number;
  engagementRate: number;
  avgSessionSeconds: number;
};

export type Ga4Daily = { date: string; users: number; sessions: number };
export type Ga4Page = {
  path: string;
  views: number;
  users: number;
  avgSessionSeconds: number;
};
export type Ga4Referrer = { source: string; sessions: number; users: number };
export type Ga4Country = { country: string; users: number };
export type Ga4Device = { device: string; users: number };

export type GscSummary = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};
export type GscQueryRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};
export type GscPageRow = {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type Ga4Payload = {
  summary: Ga4Summary;
  dailyTrend: Ga4Daily[];
  topPages: Ga4Page[];
  referrers: Ga4Referrer[];
  directSessions: number;
  countries: Ga4Country[];
  devices: Ga4Device[];
};

export type GscPayload = {
  summary: GscSummary;
  topQueries: GscQueryRow[];
  topPages: GscPageRow[];
};

export type AnalyticsResponse = {
  period: Period;
  ga4: Ga4Payload | null;
  gsc: GscPayload | null;
  ga4Error: string | null;
  gscError: string | null;
  generatedAt: string;
};

export function parsePeriod(raw: string | null | undefined): Period {
  if (raw === '7d' || raw === '90d') return raw;
  return '30d';
}

function periodToDays(period: Period): number {
  if (period === '7d') return 7;
  if (period === '90d') return 90;
  return 30;
}

function formatIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatGa4Date(raw: string): string {
  if (raw.length !== 8) return raw;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function num(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

export async function fetchAnalytics(period: Period): Promise<AnalyticsResponse> {
  const days = periodToDays(period);
  const today = new Date();
  const endDate = formatIsoDate(today);
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const startDate = formatIsoDate(start);

  let ga4Error: string | null = null;
  let gscError: string | null = null;

  let ga4PropertyId: string | null = null;
  try {
    ga4PropertyId = getGa4PropertyId();
  } catch (err) {
    ga4Error = err instanceof Error ? err.message : 'GA4 property id missing';
  }

  let ga4: ReturnType<typeof getGa4Client> | null = null;
  if (ga4PropertyId) {
    try {
      ga4 = getGa4Client();
    } catch (err) {
      ga4Error = err instanceof Error ? err.message : 'GA4 client init failed';
    }
  }

  let gscSiteUrl: string | null = null;
  const rawGscSite = process.env.GSC_SITE_URL;
  const gscConfigured = Boolean(rawGscSite && rawGscSite.trim().length > 0);
  if (gscConfigured) {
    try {
      gscSiteUrl = getGscSiteUrl();
    } catch (err) {
      gscError = err instanceof Error ? err.message : 'GSC site url missing';
    }
  }

  let gsc: ReturnType<typeof getGscClient> | null = null;
  if (gscConfigured && gscSiteUrl) {
    try {
      gsc = getGscClient();
    } catch (err) {
      gscError = err instanceof Error ? err.message : 'GSC client init failed';
    }
  }

  const ga4Ready = Boolean(ga4 && ga4PropertyId);
  const gscReady = Boolean(gsc && gscSiteUrl);

  const ga4Summary = ga4Ready
    ? ga4!.runReport({
        property: ga4PropertyId!,
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'totalUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'engagementRate' },
          { name: 'averageSessionDuration' },
        ],
      })
    : Promise.reject(new Error('GA4 not configured'));

  const ga4Daily = ga4Ready
    ? ga4!.runReport({
        property: ga4PropertyId!,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      })
    : Promise.reject(new Error('GA4 not configured'));

  const ga4Pages = ga4Ready
    ? ga4!.runReport({
        property: ga4PropertyId!,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'totalUsers' },
          { name: 'averageSessionDuration' },
        ],
        limit: 20,
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      })
    : Promise.reject(new Error('GA4 not configured'));

  const ga4Referrers = ga4Ready
    ? ga4!.runReport({
        property: ga4PropertyId!,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionSource' }],
        metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
        limit: 15,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      })
    : Promise.reject(new Error('GA4 not configured'));

  const ga4Countries = ga4Ready
    ? ga4!.runReport({
        property: ga4PropertyId!,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'totalUsers' }],
        limit: 10,
        orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      })
    : Promise.reject(new Error('GA4 not configured'));

  const ga4Devices = ga4Ready
    ? ga4!.runReport({
        property: ga4PropertyId!,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'totalUsers' }],
      })
    : Promise.reject(new Error('GA4 not configured'));

  const gscSummary = gscReady
    ? gsc!.searchanalytics.query({
        siteUrl: gscSiteUrl!,
        requestBody: { startDate, endDate, rowLimit: 1 },
      })
    : Promise.reject(new Error('GSC not configured'));

  const gscQueries = gscReady
    ? gsc!.searchanalytics.query({
        siteUrl: gscSiteUrl!,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['query'],
          rowLimit: 25,
        },
      })
    : Promise.reject(new Error('GSC not configured'));

  const gscPages = gscReady
    ? gsc!.searchanalytics.query({
        siteUrl: gscSiteUrl!,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['page'],
          rowLimit: 15,
        },
      })
    : Promise.reject(new Error('GSC not configured'));

  const [
    rawSummary,
    rawDaily,
    rawPages,
    rawReferrers,
    rawCountries,
    rawDevices,
    rawGscSummary,
    rawGscQueries,
    rawGscPages,
  ] = await Promise.allSettled([
    ga4Summary,
    ga4Daily,
    ga4Pages,
    ga4Referrers,
    ga4Countries,
    ga4Devices,
    gscSummary,
    gscQueries,
    gscPages,
  ]);

  let ga4Payload: Ga4Payload | null = null;
  if (ga4Ready) {
    try {
      const summaryRow = settled(rawSummary, null)?.[0]?.rows?.[0];
      const summaryValues = summaryRow?.metricValues ?? [];
      const summary: Ga4Summary = {
        users: num(summaryValues[0]?.value),
        sessions: num(summaryValues[1]?.value),
        pageViews: num(summaryValues[2]?.value),
        engagementRate: num(summaryValues[3]?.value) * 100,
        avgSessionSeconds: num(summaryValues[4]?.value),
      };

      const dailyRows = settled(rawDaily, null)?.[0]?.rows ?? [];
      const dailyTrend: Ga4Daily[] = dailyRows.map((row) => ({
        date: formatGa4Date(row.dimensionValues?.[0]?.value ?? ''),
        users: num(row.metricValues?.[0]?.value),
        sessions: num(row.metricValues?.[1]?.value),
      }));

      const pageRows = settled(rawPages, null)?.[0]?.rows ?? [];
      const topPages: Ga4Page[] = pageRows.map((row) => ({
        path: row.dimensionValues?.[0]?.value ?? '',
        views: num(row.metricValues?.[0]?.value),
        users: num(row.metricValues?.[1]?.value),
        avgSessionSeconds: num(row.metricValues?.[2]?.value),
      }));

      const referrerRows = settled(rawReferrers, null)?.[0]?.rows ?? [];
      let directSessions = 0;
      const referrers: Ga4Referrer[] = [];
      referrerRows.forEach((row) => {
        const source = row.dimensionValues?.[0]?.value ?? '';
        const sessions = num(row.metricValues?.[0]?.value);
        const users = num(row.metricValues?.[1]?.value);
        if (source === '(direct)' || source === 'direct') {
          directSessions += sessions;
          return;
        }
        referrers.push({ source, sessions, users });
      });

      const countryRows = settled(rawCountries, null)?.[0]?.rows ?? [];
      const countries: Ga4Country[] = countryRows.map((row) => ({
        country: row.dimensionValues?.[0]?.value ?? 'Unknown',
        users: num(row.metricValues?.[0]?.value),
      }));

      const deviceRows = settled(rawDevices, null)?.[0]?.rows ?? [];
      const devices: Ga4Device[] = deviceRows.map((row) => ({
        device: row.dimensionValues?.[0]?.value ?? 'unknown',
        users: num(row.metricValues?.[0]?.value),
      }));

      ga4Payload = {
        summary,
        dailyTrend,
        topPages,
        referrers,
        directSessions,
        countries,
        devices,
      };
    } catch (err) {
      ga4Error = err instanceof Error ? err.message : 'GA4 processing failed';
      ga4Payload = null;
    }

    if (
      rawSummary.status === 'rejected' &&
      rawDaily.status === 'rejected' &&
      rawPages.status === 'rejected' &&
      rawReferrers.status === 'rejected' &&
      rawCountries.status === 'rejected' &&
      rawDevices.status === 'rejected'
    ) {
      ga4Error =
        ga4Error ??
        (rawSummary.reason instanceof Error
          ? rawSummary.reason.message
          : 'GA4 fetch failed');
      ga4Payload = null;
    }
  }

  let gscPayload: GscPayload | null = null;
  if (gscReady) {
    try {
      const summaryRows = settled(rawGscSummary, null)?.data?.rows ?? [];
      type Aggregate = {
        clicks: number;
        impressions: number;
        ctrSum: number;
        positionSum: number;
        count: number;
      };
      const aggregate = summaryRows.reduce<Aggregate>(
        (acc, row) => ({
          clicks: acc.clicks + (row.clicks ?? 0),
          impressions: acc.impressions + (row.impressions ?? 0),
          ctrSum: acc.ctrSum + (row.ctr ?? 0),
          positionSum: acc.positionSum + (row.position ?? 0),
          count: acc.count + 1,
        }),
        { clicks: 0, impressions: 0, ctrSum: 0, positionSum: 0, count: 0 },
      );
      const gscSummaryVal: GscSummary = {
        clicks: aggregate.clicks,
        impressions: aggregate.impressions,
        ctr:
          aggregate.impressions > 0
            ? (aggregate.clicks / aggregate.impressions) * 100
            : aggregate.count > 0
              ? (aggregate.ctrSum / aggregate.count) * 100
              : 0,
        position: aggregate.count > 0 ? aggregate.positionSum / aggregate.count : 0,
      };

      const queryRows = settled(rawGscQueries, null)?.data?.rows ?? [];
      const topQueries: GscQueryRow[] = queryRows.map((row) => ({
        query: row.keys?.[0] ?? '',
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        ctr: (row.ctr ?? 0) * 100,
        position: row.position ?? 0,
      }));

      const pageRows = settled(rawGscPages, null)?.data?.rows ?? [];
      const topPages: GscPageRow[] = pageRows.map((row) => ({
        page: row.keys?.[0] ?? '',
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        ctr: (row.ctr ?? 0) * 100,
        position: row.position ?? 0,
      }));

      gscPayload = { summary: gscSummaryVal, topQueries, topPages };
    } catch (err) {
      gscError = err instanceof Error ? err.message : 'GSC processing failed';
      gscPayload = null;
    }

    if (
      rawGscSummary.status === 'rejected' &&
      rawGscQueries.status === 'rejected' &&
      rawGscPages.status === 'rejected'
    ) {
      gscError =
        gscError ??
        (rawGscSummary.reason instanceof Error
          ? rawGscSummary.reason.message
          : 'GSC fetch failed');
      gscPayload = null;
    }
  }

  return {
    period,
    ga4: ga4Payload,
    gsc: gscPayload,
    ga4Error,
    gscError,
    generatedAt: new Date().toISOString(),
  };
}
