/**
 * /admin/login — Google Sign-In page
 * Publicly accessible (middleware allows it).
 *
 * This is a full-page admin login, NOT using the public site layout.
 * It's rendered inside the root layout but PublicShell skips Header/Footer for /admin.
 */
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AdminLoginPage } from './AdminLoginPage';

export const metadata = {
  title: 'Admin Login | Akaal Psychiatry',
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Already logged in → go to dashboard
  const session = await getSession();
  if (session) redirect('/admin');

  const { error } = await searchParams;

  return <AdminLoginPage error={error} />;
}
