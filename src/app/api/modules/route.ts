import { NextResponse } from 'next/server';
import { getTenant } from '@/lib/kernel/tenant';
import { getModuleIds } from '@/lib/kernel/modules';

export const dynamic = 'force-dynamic';

/** GET /api/modules — returns active module IDs for the current tenant */
export async function GET() {
  const tenant = await getTenant();
  if (!tenant) return NextResponse.json({ modules: [] });
  const modules = await getModuleIds(tenant.id);
  return NextResponse.json({ modules });
}
