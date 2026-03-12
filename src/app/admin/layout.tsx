/**
 * /admin layout — conditionally shows admin shell.
 *
 * The middleware (middleware.ts) handles auth + sets x-admin-email header.
 * Login page (/admin/login) won't have this header → renders without shell.
 * All other /admin/* pages will have the header → renders with sidebar shell.
 */
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ModulesProvider } from '@/lib/hooks/use-modules';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const adminEmail = headersList.get('x-admin-email');

  // Not authenticated or on login page — render without shell
  if (!adminEmail) {
    return <>{children}</>;
  }

  // Authenticated — get full session for sidebar
  const session = await getSession();

  return (
    <ModulesProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar
          session={{
            email: session?.email ?? adminEmail,
            name: session?.name ?? headersList.get('x-admin-name') ?? adminEmail,
            picture: session?.picture ?? null,
            role: session?.role ?? (headersList.get('x-admin-role') || 'staff'),
          }}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ModulesProvider>
  );
}
