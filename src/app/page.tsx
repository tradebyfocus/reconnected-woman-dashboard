import { fetchAnalytics } from '@/lib/analytics';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const initialData = await fetchAnalytics('30d');
  return <DashboardClient initialData={initialData} />;
}
