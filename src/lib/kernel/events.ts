import { createServiceClient } from '@/lib/db/server';

interface EmitEventParams {
  tenantId: string;
  module: string;
  event: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  actorId?: string;
  actorType?: 'user' | 'agent' | 'system';
}

/**
 * Writes an event to the platform_events event bus.
 * Modules listen via Supabase Realtime. They never call each other directly.
 */
export async function emitEvent(params: EmitEventParams): Promise<void> {
  const db = createServiceClient();
  const { error } = await db.from('platform_events').insert({
    tenant_id:   params.tenantId,
    module:      params.module,
    event:       params.event,
    entity_type: params.entityType ?? null,
    entity_id:   params.entityId   ?? null,
    payload:     params.payload    ?? {},
    actor_id:    params.actorId    ?? null,
    actor_type:  params.actorType  ?? (params.actorId ? 'user' : 'system'),
  });
  if (error) console.error(`[kernel/events] ${params.module}.${params.event}:`, error.message);
}
