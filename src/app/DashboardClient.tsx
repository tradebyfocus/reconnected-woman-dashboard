'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
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
const BURGUNDY = '#6B2737';
const INK_MUTED = '#6B5F50';
const BORDER = 'rgba(107, 95, 80, 0.15)';

function formatInt(value: number): string {
  return Math.round(value).toLocaleString('en-GB');
}

function formatPct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

function formatPosition(value: number): string {
  return value.toFixed(1);
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  const total = Math.round(seconds);
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
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

function truncatePath(path: string, max = 48): string {
  if (path.length <= max) return path;
  return `${path.slice(0, max - 1)}…`;
}

const cardStyle: CSSProperties = {
  background: 'var(--cream-alt)',
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  padding: 24,
};

const sectionHeadingStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 22,
  color: 'var(--ink)',
  margin: '0 0 16px',
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
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: INK_MUTED,
          fontFamily: 'var(--font-body)',
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 40,
          color: BURGUNDY,
          lineHeight: 1,
          fontWeight: 500,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 13,
          color: INK_MUTED,
          marginTop: 8,
          fontFamily: 'var(--font-body)',
        }}
      >
        {unit}
      </div>
    </div>
  );
}

function TrafficChart({ data }: { data: Ga4Daily[] }) {
  const width = 1000;
  const height = 260;
  const padding = { top: 24, right: 16, bottom: 32, left: 48 };

  if (data.length === 0) {
    return (
      <div
        style={{
          color: INK_MUTED,
          fontSize: 14,
          textAlign: 'center',
          padding: '40px 0',
        }}
      >
        No data for this period yet.
      </div>
    );
  }

  const maxY = Math.max(1, ...data.flatMap((d) => [d.users, d.sessions]));
  const xAt = (i: number) => {
    if (data.length === 1) return padding.left + (width - padding.left - padding.right) / 2;
    return (
      padding.left +
      (i / (data.length - 1)) * (width - padding.left - padding.right)
    );
  };
  const yAt = (val: number) =>
    padding.top +
    (1 - val / maxY) * (height - padding.top - padding.bottom);

  const usersPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(d.users).toFixed(1)}`)
    .join(' ');
  const sessionsPath = data
    .map(
      (d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(d.sessions).toFixed(1)}`,
    )
    .join(' ');

  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => (maxY / tickCount) * i);

  const labelStep = Math.max(1, Math.ceil(data.length / 6));
  const xLabels = data
    .map((d, i) => ({ d, i }))
    .filter(({ i }) => i % labelStep === 0 || i === data.length - 1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: 260, display: 'block' }}
      role="img"
      aria-label="Daily visitors and sessions trend"
    >
      {yTicks.map((t, i) => {
        const y = yAt(t);
        return (
          <g key={i}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke={BORDER}
              strokeWidth={1}
            />
            <text
              x={padding.left - 10}
              y={y + 4}
              fontSize={11}
              fontFamily="var(--font-body)"
              fill={INK_MUTED}
              textAnchor="end"
            >
              {formatInt(t)}
            </text>
          </g>
        );
      })}
      {xLabels.map(({ d, i }) => (
        <text
          key={d.date}
          x={xAt(i)}
          y={height - padding.bottom + 20}
          fontSize={11}
          fontFamily="var(--font-body)"
          fill={INK_MUTED}
          textAnchor="middle"
        >
          {d.date.slice(5)}
        </text>
      ))}
      <path
        d={sessionsPath}
        fill="none"
        stroke={DUSTY_ROSE}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d={usersPath}
        fill="none"
        stroke={SAGE}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DeviceBreakdown({ devices }: { devices: Ga4Device[] }) {
  const total = devices.reduce((sum, d) => sum + d.users, 0);
  if (total === 0) {
    return (
      <div style={{ color: INK_MUTED, fontSize: 14 }}>No device data yet.</div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {devices.map((d) => {
        const pct = total > 0 ? (d.users / total) * 100 : 0;
        const label = d.device.charAt(0).toUpperCase() + d.device.slice(1);
        return (
          <div key={d.device}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                marginBottom: 6,
                color: 'var(--ink)',
              }}
            >
              <span>{label}</span>
              <span style={{ color: INK_MUTED, fontVariantNumeric: 'tabular-nums' }}>
                {formatInt(d.users)} · {formatPct(pct, 0)}
              </span>
            </div>
            <div
              style={{
                height: 8,
                background: 'var(--cream)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.max(2, Math.min(100, pct))}%`,
                  height: '100%',
                  background: SAGE,
                  borderRadius: 999,
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

  useEffect(() => {
    if (period === initialData.period && data === initialData) return;
  }, [period, initialData, data]);

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

  const overviewCards = useMemo(
    () => [
      {
        label: 'Total visitors',
        value: ga4 ? formatInt(ga4.summary.users) : '—',
        unit: 'unique people',
      },
      {
        label: 'Page views',
        value: ga4 ? formatInt(ga4.summary.pageViews) : '—',
        unit: 'pages viewed',
      },
      {
        label: 'Engagement',
        value: ga4 ? formatPct(ga4.summary.engagementRate, 0) : '—',
        unit: 'of visits engaged',
      },
      {
        label: 'Search clicks',
        value: gsc ? formatInt(gsc.summary.clicks) : '—',
        unit: 'via Google',
      },
    ],
    [ga4, gsc],
  );

  const gscCards = useMemo(
    () => [
      {
        label: 'Clicks',
        value: gsc ? formatInt(gsc.summary.clicks) : '—',
        unit: 'from Google search',
      },
      {
        label: 'Impressions',
        value: gsc ? formatInt(gsc.summary.impressions) : '—',
        unit: 'times shown',
      },
      {
        label: 'Click-through rate',
        value: gsc ? formatPct(gsc.summary.ctr, 1) : '—',
        unit: 'of impressions clicked',
      },
      {
        label: 'Average position',
        value: gsc ? formatPosition(gsc.summary.position) : '—',
        unit: 'in search results',
      },
    ],
    [gsc],
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <header style={{ paddingTop: 48, paddingBottom: 28 }}>
        <div className="rw-container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
            }}
          >
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontFamily: 'var(--font-script)',
                  fontSize: 48,
                  color: BURGUNDY,
                  margin: 0,
                  lineHeight: 1,
                  fontWeight: 400,
                }}
              >
                Your Dashboard
              </h1>
              <p
                style={{
                  margin: '14px 0 0',
                  fontFamily: 'var(--font-body)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  fontSize: 11,
                  color: INK_MUTED,
                }}
              >
                The Reconnected Woman
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: INK_MUTED,
                padding: 4,
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
          </div>
          <div
            style={{
              height: 1,
              background: DUSTY_ROSE,
              opacity: 0.2,
              marginTop: 20,
            }}
          />
        </div>
      </header>

      <div className="rw-container" style={{ paddingBottom: 64 }}>
        <section
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: INK_MUTED,
              fontFamily: 'var(--font-body)',
            }}
          >
            Last updated {formatUpdatedAt(data.generatedAt)}
            {loading ? ' · refreshing…' : ''}
          </div>
          <div
            role="radiogroup"
            aria-label="Period selector"
            style={{ display: 'flex', gap: 8 }}
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
                    padding: '8px 16px',
                    fontSize: 13,
                    fontFamily: 'var(--font-body)',
                    borderRadius: 999,
                    background: active ? SAGE : 'var(--cream-alt)',
                    color: active ? 'var(--cream)' : SAGE,
                    border: `1px solid ${active ? SAGE : BORDER}`,
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
              fontSize: 14,
              marginBottom: 24,
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
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            Google Analytics isn&apos;t connected yet: {data.ga4Error}
          </div>
        )}

        <section className="rw-stats-grid" style={{ marginBottom: 24 }}>
          {overviewCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              unit={card.unit}
            />
          ))}
        </section>

        <section style={{ ...cardStyle, marginBottom: 24 }}>
          <h2 style={sectionHeadingStyle}>Traffic</h2>
          <p
            style={{
              color: INK_MUTED,
              fontSize: 13,
              margin: '0 0 18px',
              fontFamily: 'var(--font-body)',
            }}
          >
            Visitors and sessions, day by day.{' '}
            <span style={{ color: SAGE }}>●</span> visitors &nbsp;
            <span style={{ color: DUSTY_ROSE }}>●</span> sessions
          </p>
          <TrafficChart data={ga4?.dailyTrend ?? []} />
        </section>

        <section className="rw-two-col" style={{ marginBottom: 24 }}>
          <div style={cardStyle}>
            <h2 style={sectionHeadingStyle}>Top pages</h2>
            {ga4 && ga4.topPages.length > 0 ? (
              <table className="rw-table">
                <thead>
                  <tr>
                    <th>Path</th>
                    <th className="rw-num">Views</th>
                    <th className="rw-num rw-hide-sm">Visitors</th>
                    <th className="rw-num rw-hide-sm">Avg. time</th>
                  </tr>
                </thead>
                <tbody>
                  {ga4.topPages.slice(0, 10).map((page) => (
                    <tr key={page.path}>
                      <td title={page.path}>{truncatePath(page.path)}</td>
                      <td className="rw-num">{formatInt(page.views)}</td>
                      <td className="rw-num rw-hide-sm">{formatInt(page.users)}</td>
                      <td className="rw-num rw-hide-sm">
                        {formatDuration(page.avgSessionSeconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: INK_MUTED, fontSize: 14 }}>
                No pages tracked yet.
              </div>
            )}
          </div>
          <div style={cardStyle}>
            <h2 style={sectionHeadingStyle}>Top referrers</h2>
            {ga4 && (ga4.referrers.length > 0 || ga4.directSessions > 0) ? (
              <table className="rw-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th className="rw-num">Sessions</th>
                    <th className="rw-num rw-hide-sm">Visitors</th>
                  </tr>
                </thead>
                <tbody>
                  {ga4.directSessions > 0 && (
                    <tr>
                      <td
                        style={{ color: INK_MUTED, fontStyle: 'italic' }}
                        title="Visitors who came directly (typed the URL, bookmark, etc.)"
                      >
                        Direct traffic
                      </td>
                      <td className="rw-num">{formatInt(ga4.directSessions)}</td>
                      <td className="rw-num rw-hide-sm">—</td>
                    </tr>
                  )}
                  {ga4.referrers.slice(0, 10).map((ref) => (
                    <tr key={ref.source}>
                      <td>{ref.source}</td>
                      <td className="rw-num">{formatInt(ref.sessions)}</td>
                      <td className="rw-num rw-hide-sm">{formatInt(ref.users)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: INK_MUTED, fontSize: 14 }}>
                No referrers tracked yet.
              </div>
            )}
          </div>
        </section>

        <section className="rw-two-col" style={{ marginBottom: 48 }}>
          <div style={cardStyle}>
            <h2 style={sectionHeadingStyle}>Top countries</h2>
            {ga4 && ga4.countries.length > 0 ? (
              <table className="rw-table">
                <thead>
                  <tr>
                    <th>Country</th>
                    <th className="rw-num">Visitors</th>
                  </tr>
                </thead>
                <tbody>
                  {ga4.countries.slice(0, 10).map((row) => (
                    <tr key={row.country}>
                      <td>{row.country}</td>
                      <td className="rw-num">{formatInt(row.users)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: INK_MUTED, fontSize: 14 }}>
                No country data yet.
              </div>
            )}
          </div>
          <div style={cardStyle}>
            <h2 style={sectionHeadingStyle}>Devices</h2>
            <DeviceBreakdown devices={ga4?.devices ?? []} />
          </div>
        </section>

        <div
          role="separator"
          aria-label="Search Performance"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            margin: '8px 0 24px',
          }}
        >
          <div
            style={{
              flex: 1,
              height: 1,
              background: DUSTY_ROSE,
              opacity: 0.35,
            }}
          />
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 32,
              color: BURGUNDY,
              margin: 0,
              fontWeight: 500,
              letterSpacing: '0.01em',
            }}
          >
            Search Performance
          </h2>
          <div
            style={{
              flex: 1,
              height: 1,
              background: DUSTY_ROSE,
              opacity: 0.35,
            }}
          />
        </div>

        {data.gscError && !gsc && (
          <div
            style={{
              ...cardStyle,
              borderColor: DUSTY_ROSE,
              color: BURGUNDY,
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            Search Console isn&apos;t connected yet: {data.gscError}
          </div>
        )}

        <section className="rw-stats-grid" style={{ marginBottom: 24 }}>
          {gscCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              unit={card.unit}
            />
          ))}
        </section>

        <section style={{ ...cardStyle, marginBottom: 24 }}>
          <h2 style={sectionHeadingStyle}>Top search queries</h2>
          <p
            style={{
              color: INK_MUTED,
              fontSize: 13,
              margin: '0 0 16px',
              fontFamily: 'var(--font-body)',
            }}
          >
            What people typed into Google to find your site.
          </p>
          {gsc && gsc.topQueries.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="rw-table">
                <thead>
                  <tr>
                    <th>Query</th>
                    <th className="rw-num">Clicks</th>
                    <th className="rw-num rw-hide-sm">Impressions</th>
                    <th className="rw-num">CTR</th>
                    <th className="rw-num rw-hide-sm">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {gsc.topQueries.slice(0, 15).map((row) => (
                    <tr key={row.query}>
                      <td>{row.query}</td>
                      <td className="rw-num">{formatInt(row.clicks)}</td>
                      <td className="rw-num rw-hide-sm">
                        {formatInt(row.impressions)}
                      </td>
                      <td className="rw-num">{formatPct(row.ctr, 1)}</td>
                      <td className="rw-num rw-hide-sm">
                        {formatPosition(row.position)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: INK_MUTED, fontSize: 14 }}>
              No search queries yet.
            </div>
          )}
        </section>

        <section style={{ ...cardStyle, marginBottom: 48 }}>
          <h2 style={sectionHeadingStyle}>Top pages in search</h2>
          <p
            style={{
              color: INK_MUTED,
              fontSize: 13,
              margin: '0 0 16px',
              fontFamily: 'var(--font-body)',
            }}
          >
            Which pages Google sends visitors to.
          </p>
          {gsc && gsc.topPages.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="rw-table">
                <thead>
                  <tr>
                    <th>Page</th>
                    <th className="rw-num">Clicks</th>
                    <th className="rw-num rw-hide-sm">Impressions</th>
                    <th className="rw-num">CTR</th>
                    <th className="rw-num rw-hide-sm">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {gsc.topPages.slice(0, 10).map((row) => (
                    <tr key={row.page}>
                      <td title={row.page}>{truncatePath(row.page, 56)}</td>
                      <td className="rw-num">{formatInt(row.clicks)}</td>
                      <td className="rw-num rw-hide-sm">
                        {formatInt(row.impressions)}
                      </td>
                      <td className="rw-num">{formatPct(row.ctr, 1)}</td>
                      <td className="rw-num rw-hide-sm">
                        {formatPosition(row.position)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: INK_MUTED, fontSize: 14 }}>
              No search pages yet.
            </div>
          )}
        </section>

        <footer
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: INK_MUTED,
            fontFamily: 'var(--font-body)',
            paddingTop: 8,
          }}
        >
          Made with care for Kelly · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
