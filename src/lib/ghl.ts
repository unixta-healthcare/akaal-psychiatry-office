/**
 * CRM API client for Akaal Psychiatry admin panel.
 * Internal server-side module — never import on the client.
 *
 * Required env vars (set in Vercel):
 *   MARKYY_API_KEY      — Private API key from CRM integration settings
 *   MARKYY_LOCATION_ID  — Sub-account location ID
 */

const API_BASE = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

function getApiKey(): string {
  const key = process.env.MARKYY_API_KEY;
  if (!key) throw new Error('CRM integration not configured');
  return key;
}

export function getLocationId(): string {
  const id = process.env.MARKYY_LOCATION_ID;
  if (!id) throw new Error('CRM location not configured');
  return id;
}

async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
      Version: API_VERSION,
      ...(options?.headers as Record<string, string> || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CRM API ${res.status} on ${path}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CRMContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tags?: string[];
  dateAdded?: string;
  source?: string;
  locationId: string;
}

export interface CRMFormSubmission {
  id: string;
  contactId?: string;
  contactSessionIds?: string[];
  pageUrl?: string;
  formId: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  others?: Record<string, string>;
  fieldData?: Array<{ id: string; name: string; fieldValue: string | string[] }>;
  createdAt: string;
  updatedAt?: string;
}

export interface CRMAppointment {
  id: string;
  calendarId: string;
  locationId: string;
  contactId: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  appointmentStatus: string;
  notes?: string;
  contact?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface CRMConversation {
  id: string;
  contactId: string;
  locationId: string;
  lastMessageType?: string;
  lastMessageDate?: string;
  unreadCount?: number;
  type?: string;
  contact?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export interface CRMMessage {
  id: string;
  conversationId: string;
  body: string;
  type: string;
  direction: 'inbound' | 'outbound';
  dateAdded: string;
  status?: string;
}

// ─── Form Submissions ─────────────────────────────────────────────────────────

export async function getFormSubmissions(
  formId: string,
  page = 1,
  limit = 25
): Promise<{ submissions: CRMFormSubmission[]; total: number }> {
  const locationId = getLocationId();
  const params = new URLSearchParams({
    locationId,
    formId,
    page: String(page),
    limit: String(limit),
  });

  const data = await apiFetch<{
    submissions?: CRMFormSubmission[];
    meta?: { total: number };
  }>(`/forms/submissions?${params}`);

  return {
    submissions: data.submissions || [],
    total: data.meta?.total ?? 0,
  };
}

export async function getAllForms(): Promise<Array<{ id: string; name: string }>> {
  const locationId = getLocationId();
  const data = await apiFetch<{ forms?: Array<{ id: string; name: string }> }>(
    `/forms?locationId=${locationId}&limit=50`
  );
  return data.forms || [];
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export async function getContacts(
  query = '',
  page = 1,
  limit = 25
): Promise<{ contacts: CRMContact[]; total: number }> {
  const locationId = getLocationId();
  const params = new URLSearchParams({
    locationId,
    limit: String(limit),
    startAfter: String((page - 1) * limit),
  });
  if (query) params.set('query', query);

  const data = await apiFetch<{
    contacts?: CRMContact[];
    meta?: { total: number };
  }>(`/contacts/?${params}`);

  return {
    contacts: data.contacts || [],
    total: data.meta?.total ?? 0,
  };
}

export async function getContact(contactId: string): Promise<CRMContact | null> {
  try {
    const data = await apiFetch<{ contact: CRMContact }>(
      `/contacts/${contactId}`
    );
    return data.contact;
  } catch {
    return null;
  }
}

// ─── Appointments / Calendar ──────────────────────────────────────────────────

export async function getAppointments(
  startTime: string,
  endTime: string,
  calendarId?: string
): Promise<CRMAppointment[]> {
  const locationId = getLocationId();
  const params = new URLSearchParams({
    locationId,
    startTime,
    endTime,
  });
  if (calendarId) params.set('calendarId', calendarId);

  const data = await apiFetch<{ events?: CRMAppointment[] }>(
    `/calendars/events?${params}`
  );
  return data.events || [];
}

export async function getCalendars(): Promise<Array<{ id: string; name: string }>> {
  const locationId = getLocationId();
  const data = await apiFetch<{
    calendars?: Array<{ id: string; name: string }>;
  }>(`/calendars/?locationId=${locationId}&limit=50`);
  return data.calendars || [];
}

// ─── Conversations / Messages ─────────────────────────────────────────────────

export async function getConversations(
  page = 1,
  limit = 25
): Promise<{ conversations: CRMConversation[]; total: number }> {
  const locationId = getLocationId();
  const params = new URLSearchParams({
    locationId,
    limit: String(limit),
    offset: String((page - 1) * limit),
    sort: 'last_message_date',
    sortBy: 'last_message_date',
    sortOrder: 'desc',
  });

  const data = await apiFetch<{
    conversations?: CRMConversation[];
    total?: number;
  }>(`/conversations/search?${params}`);

  return {
    conversations: data.conversations || [],
    total: data.total ?? 0,
  };
}

export async function getMessages(
  conversationId: string,
  limit = 50
): Promise<CRMMessage[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const data = await apiFetch<{ messages?: { messages: CRMMessage[] } }>(
    `/conversations/${conversationId}/messages?${params}`
  );
  return data.messages?.messages || [];
}

export async function sendMessage(
  conversationId: string,
  body: string,
  type: 'SMS' | 'Email' = 'SMS'
): Promise<void> {
  await apiFetch(`/conversations/messages`, {
    method: 'POST',
    body: JSON.stringify({ conversationId, body, type }),
  });
}
