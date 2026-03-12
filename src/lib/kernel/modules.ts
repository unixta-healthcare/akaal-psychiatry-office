import { createServiceClient } from '@/lib/db/server';

export interface TenantModule {
  module_id: string;
  status: string;
  config: Record<string, unknown>;
}

export async function getActiveModules(tenantId: string): Promise<TenantModule[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from('tenant_modules')
    .select('module_id,status,config')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .order('module_id');
  if (error) { console.error('[kernel/modules]', error.message); return []; }
  return data as TenantModule[];
}

export async function getModuleIds(tenantId: string): Promise<string[]> {
  const modules = await getActiveModules(tenantId);
  return modules.map((m) => m.module_id);
}
