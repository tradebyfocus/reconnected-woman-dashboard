'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import type {
  AnalyticsResponse,
  Ga4Daily,
  Ga4Device,
  Period,
} from '@/lib/analytics';

const PERIODS: { value: Period; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

const SAGE = '#7A8A6E';
const DUSTY_ROSE = '#C19A8B';
const TAN = '#B08968';
const BURGUNDY = '#6B2737';
const INK_MUTED = '#6B5F50';
const BORDER = 'rgba(107, 95, 80, 0.15)';
const TRACK_BG = 'rgba(107,95,80,0.1)';
const ROSE_LINE = 'rgba(193, 154, 139, 0.45)';
const ROSE_LINE_SOFT = 'rgba(193, 154, 139, 0.4)';
const GRID_SOFT = 'rgba(107,95,80,0.1)';
const GRID_BASELINE = 'rgba(107,95,80,0.15)';

function formatInt(value: number): string {
  return Math.round(value).toLocaleString('en-GB');
}

function formatPct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

function formatPosition(value: number): string {
  return value.toFixed(1);
}

function formatUpdatedAt(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function truncatePath(path: string, max = 36): string {
  if (path.length <= max) return path;
  return `${path.slice(0, max - 1)}…`;
}

const cardStyle: CSSProperties = {
  background: 'var(--cream-alt)',
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  padding: 18,
};

const sectionHeadingStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 16,
  color: 'var(--ink)',
  margin: '0 0 10px',
  fontWeight: 500,
};

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  color: INK_MUTED,
  fontSize: 10,
  fontWeight: 500,
};

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div style={cardStyle}>
      <div style={labelStyle}>{label}</div>
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 32,
          color: BURGUNDY,
          fontWeight: 500,
          lineHeight: 1.1,
          margin: '6px 0 3px',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          color: INK_MUTED,
          fontSize: 11,
        }}
      >
        {unit}
      </div>
    </div>
  );
}

function TrafficChart({ data }: { data: Ga4Daily[] }) {
  const width = 620;
  const height = 170;
  const paddingX = 10;
  const chartTop = 20;
  const chartBottom = 150;

  if (data.length === 0) {
    return (
      <div
        style={{
          color: INK_MUTED,
          fontSize: 13,
          textAlign: 'center',
          padding: '30px 0',
        }}
      >
        No data for this period yet.
      </div>
    );
  }

  const maxY = Math.max(1, ...data.flatMap((d) => [d.users, d.sessions]));
  const xAt = (i: number) => {
    if (data.length === 1) return width / 2;
    return (
      paddingX + (i / (data.length - 1)) * (width - paddingX * 2)
    );
  };
  const yAt = (val: number) =>
    chartTop + (1 - val / maxY) * (chartBottom - chartTop);

  const usersPoints = data
    .map((d, i) => `${xAt(i).toFixed(1)},${yAt(d.users).toFixed(1)}`)
    .join(' ');
  const sessionsPoints = data
    .map((d, i) => `${xAt(i).toFixed(1)},${yAt(d.sessions).toFixed(1)}`)
    .join(' ');

  const firstLabel = data[0]?.date.slice(5) ?? '';
  const lastIndex = data.length - 1;
  const lastLabel = data[lastIndex]?.date.slice(5) ?? '';
  const midIndex = Math.floor(lastIndex / 2);
  const midLabel = data[midIndex]?.date.slice(5) ?? '';

  const gridYs = [30, 75, 120];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={170}
      preserveAspectRatio="none"
      role="img"
      aria-label="Daily visitors and sessions trend"
    >
      {gridYs.map((y) => (
        <line
          key={y}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke={GRID_SOFT}
          strokeWidth={1}
        />
      ))}
      <line
        x1={0}
        y1={chartBottom + 5}
        x2={width}
        y2={chartBottom + 5}
        stroke={GRID_BASELINE}
        strokeWidth={1}
      />
      <polyline
        points={sessionsPoints}
        fill="none"
        stroke={DUSTY_ROSE}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <polyline
        points={usersPoints}
        fill="none"
        stroke={SAGE}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <text x={0} y={168} fontFamily="Inter" fontSize={10} fill={INK_MUTED}>
        {firstLabel}
      </text>
      <text
        x={width / 2 - 20}
        y={168}
        fontFamily="Inter"
        fontSize={10}
        fill={INK_MUTED}
      >
        {midLabel}
      </text>
      <text
        x={width - 40}
        y={168}
        fontFamily="Inter"
        fontSize={10}
        fill={INK_MUTED}
        textAnchor="start"
      >
        {lastLabel}
      </text>
    </svg>
  );
}

const DEVICE_COLORS = [SAGE, DUSTY_ROSE, TAN, INK_MUTED];

function DeviceBreakdown({ devices }: { devices: Ga4Device[] }) {
  const total = devices.reduce((sum, d) => sum + d.users, 0);
  if (total === 0) {
    return (
      <div style={{ color: INK_MUTED, fontSize: 13 }}>
        No device data yet.
      </div>
    );
  }
  const order: string[] = ['mobile', 'desktop', 'tablet'];
  const sorted = [...devices].sort((a, b) => {
    const aIdx = order.indexOf(a.device.toLowerCase());
    const bIdx = order.indexOf(b.device.toLowerCase());
    const aKey = aIdx === -1 ? order.length : aIdx;
    const bKey = bIdx === -1 ? order.length : bIdx;
    return aKey - bKey;
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sorted.map((d, i) => {
        const pct = total > 0 ? (d.users / total) * 100 : 0;
        const label = d.device.charAt(0).toUpperCase() + d.device.slice(1);
        const color = DEVICE_COLORS[i % DEVICE_COLORS.length];
        return (
          <div key={d.device}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: INK_MUTED,
                marginBottom: 4,
              }}
            >
              <span>{label}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatPct(pct, 0)}
              </span>
            </div>
            <div
              style={{
                height: 8,
                background: TRACK_BG,
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.max(2, Math.min(100, pct))}%`,
                  height: '100%',
                  background: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardClient({
  initialData,
}: {
  initialData: AnalyticsResponse;
}) {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsResponse>(initialData);
  const [period, setPeriod] = useState<Period>(initialData.period);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  async function changePeriod(next: Period) {
    if (next === period && data) return;
    setPeriod(next);
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/analytics?period=${next}`, { cache: 'no-store' });
      const json = (await res.json()) as AnalyticsResponse;
      setData(json);
    } catch {
      setFetchError("We couldn't refresh the numbers. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  const ga4 = data.ga4;
  const gsc = data.gsc;

  const overviewCards = useMemo(() => {
    const baseline = [
      {
        label: 'Visitors',
        value: ga4 ? formatInt(ga4.summary.users) : '—',
        unit: 'unique users',
      },
      {
        label: 'Page views',
        value: ga4 ? formatInt(ga4.summary.pageViews) : '—',
        unit: 'total views',
      },
      {
        label: 'Engagement',
        value: ga4 ? formatPct(ga4.summary.engagementRate, 0) : '—',
        unit: 'avg. rate',
      },
    ];
    const fourth = gsc
      ? {
          label: 'Search clicks',
          value: formatInt(gsc.summary.clicks),
          unit: 'from Google',
        }
      : {
          label: 'Sessions',
          value: ga4 ? formatInt(ga4.summary.sessions) : '—',
          unit: 'total visits',
        };
    return [...baseline, fourth];
  }, [ga4, gsc]);

  const gscCards = useMemo(
    () => [
      {
        label: 'Clicks',
        value: gsc ? formatInt(gsc.summary.clicks) : '—',
        unit: 'from search',
      },
      {
        label: 'Impressions',
        value: gsc ? formatInt(gsc.summary.impressions) : '—',
        unit: 'shown',
      },
      {
        label: 'CTR',
        value: gsc ? formatPct(gsc.summary.ctr, 1) : '—',
        unit: 'click rate',
      },
      {
        label: 'Position',
        value: gsc ? formatPosition(gsc.summary.position) : '—',
        unit: 'avg. ranking',
      },
    ],
    [gsc],
  );

  return (
    <div className="rw-dash">
      <header
        style={{
          textAlign: 'center',
          paddingBottom: 18,
          borderBottom: `1px solid ${ROSE_LINE_SOFT}`,
          marginBottom: 22,
          position: 'relative',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-script)',
            fontSize: 50,
            color: BURGUNDY,
            lineHeight: 1.1,
            fontWeight: 400,
          }}
        >
          Your Dashboard
        </div>
        <div style={{ ...labelStyle, marginTop: 6 }}>
          The Reconnected Woman
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          style={{
            position: 'absolute',
            right: 0,
            top: 16,
            color: INK_MUTED,
            fontSize: 12,
            fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = BURGUNDY;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = INK_MUTED;
          }}
        >
          Sign out
        </button>
      </header>

      <section
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 18,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ fontSize: 12, color: INK_MUTED }}>
          Last updated {formatUpdatedAt(data.generatedAt)}
          {loading ? ' · refreshing…' : ''}
        </div>
        <div
          role="radiogroup"
          aria-label="Period selector"
          style={{ display: 'flex', gap: 6 }}
        >
          {PERIODS.map((p) => {
            const active = p.value === period;
            return (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => changePeriod(p.value)}
                disabled={loading}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  padding: '7px 16px',
                  borderRadius: 6,
                  border: `1px solid ${active ? SAGE : 'rgba(107, 95, 80, 0.2)'}`,
                  background: active ? SAGE : 'var(--cream-alt)',
                  color: active ? 'var(--cream)' : INK_MUTED,
                  transition: 'background 160ms ease, color 160ms ease',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </section>

      {fetchError && (
        <div
          style={{
            ...cardStyle,
            borderColor: DUSTY_ROSE,
            color: BURGUNDY,
            fontSize: 13,
            marginBottom: 18,
          }}
        >
          {fetchError}
        </div>
      )}

      {data.ga4Error && !ga4 && (
        <div
          style={{
            ...cardStyle,
            borderColor: DUSTY_ROSE,
            color: BURGUNDY,
            fontSize: 13,
            marginBottom: 18,
          }}
        >
          Google Analytics isn&apos;t connected yet: {data.ga4Error}
        </div>
      )}

      <div className="rw-stats-grid" style={{ marginBottom: 26 }}>
        {overviewCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            unit={card.unit}
          />
        ))}
      </div>

      <div style={{ ...cardStyle, marginBottom: 26 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 12,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 16,
              color: 'var(--ink)',
              fontWeight: 500,
            }}
          >
            Traffic over time
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
            <span style={{ color: INK_MUTED }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 2,
                  background: SAGE,
                  verticalAlign: 'middle',
                  marginRight: 6,
                }}
              />
              Visitors
            </span>
            <span style={{ color: INK_MUTED }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 2,
                  background: DUSTY_ROSE,
                  verticalAlign: 'middle',
                  marginRight: 6,
                }}
              />
              Sessions
            </span>
          </div>
        </div>
        <TrafficChart data={ga4?.dailyTrend ?? []} />
      </div>

      <div className="rw-two-col" style={{ marginBottom: 18 }}>
        <div style={cardStyle}>
          <div style={sectionHeadingStyle}>Top pages</div>
          {ga4 && ga4.topPages.length > 0 ? (
            <table className="rw-table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th className="rw-num">Views</th>
                  <th className="rw-num hide-mobile">Users</th>
                </tr>
              </thead>
              <tbody>
                {ga4.topPages.slice(0, 5).map((page) => (
                  <tr key={page.path}>
                    <td title={page.path}>{truncatePath(page.path)}</td>
                    <td className="rw-num">{formatInt(page.views)}</td>
                    <td className="rw-num hide-mobile">{formatInt(page.users)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ color: INK_MUTED, fontSize: 13 }}>
              No pages tracked yet.
            </div>
          )}
        </div>
        <div style={cardStyle}>
          <div style={sectionHeadingStyle}>Top referrers</div>
          {ga4 && (ga4.referrers.length > 0 || ga4.directSessions > 0) ? (
            <table className="rw-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th className="rw-num">Sessions</th>
                  <th className="rw-num hide-mobile">Users</th>
                </tr>
              </thead>
              <tbody>
                {ga4.directSessions > 0 && (
                  <tr>
                    <td>Direct traffic</td>
                    <td className="rw-num">{formatInt(ga4.directSessions)}</td>
                    <td className="rw-num hide-mobile">—</td>
                  </tr>
                )}
                {ga4.referrers.slice(0, 5).map((ref) => (
                  <tr key={ref.source}>
                    <td>{ref.source}</td>
                    <td className="rw-num">{formatInt(ref.sessions)}</td>
                    <td className="rw-num hide-mobile">{formatInt(ref.users)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ color: INK_MUTED, fontSize: 13 }}>
              No referrers tracked yet.
            </div>
          )}
        </div>
      </div>

      <div className="rw-two-col">
        <div style={cardStyle}>
          <div style={sectionHeadingStyle}>Top countries</div>
          {ga4 && ga4.countries.length > 0 ? (
            <table className="rw-table">
              <tbody>
                {ga4.countries.slice(0, 5).map((row) => (
                  <tr key={row.country}>
                    <td>{row.country}</td>
                    <td className="rw-num">{formatInt(row.users)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ color: INK_MUTED, fontSize: 13 }}>
              No country data yet.
            </div>
          )}
        </div>
        <div style={cardStyle}>
          <div style={{ ...sectionHeadingStyle, marginBottom: 14 }}>Devices</div>
          <DeviceBreakdown devices={ga4?.devices ?? []} />
        </div>
      </div>

      {(gsc || data.gscError) && (
        <>
          <div
            role="separator"
            aria-label="Search Performance"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              margin: '36px 0 18px',
            }}
          >
            <div style={{ flex: 1, height: 1, background: ROSE_LINE }} />
            <div
              style={{
                fontFamily: 'var(--font-script)',
                color: BURGUNDY,
                fontSize: 32,
                lineHeight: 1,
                fontWeight: 400,
              }}
            >
              Search Performance
            </div>
            <div style={{ flex: 1, height: 1, background: ROSE_LINE }} />
          </div>

          {data.gscError && !gsc && (
            <div
              style={{
                ...cardStyle,
                borderColor: DUSTY_ROSE,
                color: BURGUNDY,
                fontSize: 13,
                marginBottom: 18,
              }}
            >
              Search Console isn&apos;t connected yet: {data.gscError}
            </div>
          )}

          {gsc && (
            <>
              <div className="rw-stats-grid" style={{ marginBottom: 22 }}>
                {gscCards.map((card) => (
                  <StatCard
                    key={card.label}
                    label={card.label}
                    value={card.value}
                    unit={card.unit}
                  />
                ))}
              </div>

              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <div style={sectionHeadingStyle}>Top search queries</div>
                {gsc.topQueries.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="rw-table">
                      <thead>
                        <tr>
                          <th>Query</th>
                          <th className="rw-num">Clicks</th>
                          <th className="rw-num hide-mobile">Imp.</th>
                          <th className="rw-num hide-mobile">CTR</th>
                          <th className="rw-num">Pos.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gsc.topQueries.slice(0, 10).map((row) => (
                          <tr key={row.query}>
                            <td>{row.query}</td>
                            <td className="rw-num">{formatInt(row.clicks)}</td>
                            <td className="rw-num hide-mobile">
                              {formatInt(row.impressions)}
                            </td>
                            <td className="rw-num hide-mobile">
                              {formatPct(row.ctr, 1)}
                            </td>
                            <td className="rw-num">
                              {formatPosition(row.position)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ color: INK_MUTED, fontSize: 13 }}>
                    No search queries yet.
                  </div>
                )}
              </div>

              <div style={cardStyle}>
                <div style={sectionHeadingStyle}>Top pages in search</div>
                {gsc.topPages.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="rw-table">
                      <thead>
                        <tr>
                          <th>Page</th>
                          <th className="rw-num">Clicks</th>
                          <th className="rw-num hide-mobile">Imp.</th>
                          <th className="rw-num hide-mobile">CTR</th>
                          <th className="rw-num">Pos.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gsc.topPages.slice(0, 8).map((row) => (
                          <tr key={row.page}>
                            <td title={row.page}>
                              {truncatePath(row.page, 44)}
                            </td>
                            <td className="rw-num">{formatInt(row.clicks)}</td>
                            <td className="rw-num hide-mobile">
                              {formatInt(row.impressions)}
                            </td>
                            <td className="rw-num hide-mobile">
                              {formatPct(row.ctr, 1)}
                            </td>
                            <td className="rw-num">
                              {formatPosition(row.position)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ color: INK_MUTED, fontSize: 13 }}>
                    No search pages yet.
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      <div
        style={{
          textAlign: 'center',
          color: INK_MUTED,
          fontSize: 12,
          paddingTop: 20,
          marginTop: 28,
          borderTop: `1px solid ${ROSE_LINE_SOFT}`,
        }}
      >
        Made with care for Kelly · {new Date().getFullYear()}
      </div>
    </div>
  );
}
