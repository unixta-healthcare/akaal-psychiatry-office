/**
 * /admin — Dashboard
 */
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminDashboard } from './AdminDashboard';

export const metadata = {
  title: 'Dashboard | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return <AdminDashboard session={session} />;
}
