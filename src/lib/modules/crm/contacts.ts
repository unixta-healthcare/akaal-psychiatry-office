/**
 * CRM contacts module — reads/writes from the universal Supabase contacts table.
 * Markyy/GHL is the sync adapter; this is the source of truth for the portal.
 */
import { serverClient } from '@/lib/db/server';
import { getTenant } from '@/lib/kernel';

export interface Contact {
  id: string;
  tenant_id: string;
  first_name: string | null;
  last_name:  string | null;
  email:      string | null;
  phone:      string | null;
  status:     string | null;
  source:     string | null;
  tags:       string[] | null;
  metadata:   Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ContactInput {
  first_name?: string;
  last_name?:  string;
  email?:      string;
  phone?:      string;
  status?:     string;
  source?:     string;
  tags?:       string[];
  metadata?:   Record<string, unknown>;
}

function normalize(row: Record<string, unknown>): Contact {
  return {
    ...row,
    tags:     (row.tags as string[] | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  } as Contact;
}

export async function listContacts(opts: {
  q?:      string;
  limit?:  number;
  offset?: number;
} = {}): Promise<{ contacts: Contact[]; total: number }> {
  const db     = serverClient();
  const tenant = await getTenant();
  const { q, limit = 50, offset = 0 } = opts;

  let query = db
    .from('contacts')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return { contacts: (data ?? []).map(normalize), total: count ?? 0 };
}

export async function getContact(id: string): Promise<Contact | null> {
  const db     = serverClient();
  const tenant = await getTenant();

  const { data, error } = await db
    .from('contacts')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return normalize(data);
}

export async function createContact(input: ContactInput): Promise<Contact> {
  const db     = serverClient();
  const tenant = await getTenant();
  const now    = new Date().toISOString();

  const { data, error } = await db
    .from('contacts')
    .insert({ tenant_id: tenant.id, ...input, created_at: now, updated_at: now })
    .select()
    .single();

  if (error) throw error;
  return normalize(data);
}

export async function updateContact(id: string, input: ContactInput): Promise<Contact> {
  const db     = serverClient();
  const tenant = await getTenant();

  const { data, error } = await db
    .from('contacts')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenant.id)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return normalize(data);
}

export async function deleteContact(id: string): Promise<void> {
  const db     = serverClient();
  const tenant = await getTenant();

  const { error } = await db
    .from('contacts')
    .delete()
    .eq('tenant_id', tenant.id)
    .eq('id', id);

  if (error) throw error;
}
