/**
 * Root layout — conditionally shows admin shell.
 *
 * The middleware injects x-admin-email header when authenticated.
 * /login route won't have the header → renders without shell.
 * All other routes will have the header → renders with sidebar.
 */
import type { Metadata } from "next";
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ModulesProvider } from '@/lib/hooks/use-modules';
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Akaal Psychiatry | Admin Office",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const adminEmail = headersList.get('x-admin-email');

  // Not authenticated or on login page — render without shell
  if (!adminEmail) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </body>
      </html>
    );
  }

  // Authenticated — get full session for sidebar
  const session = await getSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ModulesProvider>
            <div className="flex h-screen bg-background overflow-hidden">
              <AdminSidebar
                session={{
                  email: session?.email ?? adminEmail,
                  name: session?.name ?? headersList.get('x-admin-name') ?? adminEmail,
                  picture: session?.picture ?? null,
                  role: session?.role ?? (headersList.get('x-admin-role') || 'staff'),
                }}
              />
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                  {children}
                </main>
              </div>
            </div>
          </ModulesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
