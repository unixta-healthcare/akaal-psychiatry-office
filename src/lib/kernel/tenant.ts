import { createServiceClient } from '@/lib/db/server';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  industry: string;
  brand: Record<string, unknown>;
  settings: Record<string, unknown>;
  active_modules: string[];
  markyy_location_id: string | null;
}

/**
 * Resolves the current tenant from TENANT_SLUG env var.
 * Throws if not found — callers should not need to null-check.
 */
export async function getTenant(): Promise<Tenant> {
  const slug = process.env.TENANT_SLUG;
  if (!slug) throw new Error('[kernel] TENANT_SLUG env var is not set');

  const db = createServiceClient();
  const { data, error } = await db
    .from('tenants')
    .select('id,slug,name,industry,brand,settings,active_modules,markyy_location_id')
    .eq('slug', slug)
    .single();

  if (error) throw new Error(`[kernel/tenant] ${error.message}`);
  if (!data)  throw new Error(`[kernel/tenant] No tenant found for slug: ${slug}`);
  return data as Tenant;
}
