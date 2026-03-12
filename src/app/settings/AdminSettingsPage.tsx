'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Settings, Users, Plus, Trash2, ShieldCheck, UserCog, Eye, Crown,
  ToggleLeft, ToggleRight, Loader2, Building2, Bell, Plug, CheckCircle2,
  XCircle, Save, UserCircle, Pencil,
} from 'lucide-react';

// ─── Tabs definition ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'profile',       label: 'Profile',        icon: UserCircle },
  { id: 'team',          label: 'Team',           icon: Users },
  { id: 'practice',      label: 'Practice',       icon: Building2 },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'integrations',  label: 'Integrations',   icon: Plug },
] as const;
type TabId = typeof TABS[number]['id'];

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const [profile, setProfile] = useState<{
    name: string; email: string; role: string;
    picture?: string; last_login_at?: string; created_at?: string;
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => { setProfile(d); setDraftName(d.name ?? ''); });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: draftName }),
    });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      setProfile(p => p ? { ...p, name: d.name } : p);
      setEditing(false); setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const d = await res.json();
      setError(d.error ?? 'Failed to save');
    }
  }

  const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    super_admin: { label: 'Super Admin', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' },
    admin:       { label: 'Admin',       color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
    staff:       { label: 'Staff',       color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' },
    readonly:    { label: 'Read Only',   color: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400' },
  };

  if (!profile) return <Spinner />;

  const initials = profile.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) ?? '?';
  const roleMeta = ROLE_LABELS[profile.role] ?? { label: profile.role, color: 'text-muted-foreground bg-muted' };

  return (
    <div className="space-y-5">
      {saved && <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm rounded-xl">Profile updated.</div>}

      {/* Avatar + identity card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <UserCircle className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Your Profile</h2>
        </div>
        <div className="px-5 py-6 flex items-start gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.picture
              ? <img src={profile.picture} alt={profile.name} className="w-16 h-16 rounded-full object-cover border-2 border-border" />
              : <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-border">{initials}</div>}
            <p className="text-xs text-muted-foreground text-center mt-1.5">Google photo</p>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4">
            {!editing ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Full Name</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{profile.name}</p>
                    <button onClick={() => setEditing(true)}
                      className="p-1 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Email</p>
                  <p className="text-sm text-foreground">{profile.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Linked via Google — cannot be changed here.</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Role</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleMeta.color}`}>{roleMeta.label}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Display Name</label>
                  <input type="text" value={draftName} onChange={e => setDraftName(e.target.value)} required autoFocus
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex items-center gap-2">
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save
                  </button>
                  <button type="button" onClick={() => { setEditing(false); setDraftName(profile.name); setError(null); }}
                    className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-xl hover:border-primary/30 transition-colors">Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Login history / meta */}
      <div className="bg-muted/30 border border-border rounded-2xl px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Last Login</p>
          <p className="text-foreground">{profile.last_login_at ? new Date(profile.last_login_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Account Created</p>
          <p className="text-foreground">{profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Unknown'}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Practice Tab ─────────────────────────────────────────────────────────────

function PracticeTab() {
  const [form, setForm] = useState({
    name: '', tagline: '', phone: '', email: '',
    address: '', city: '', state: '', zip: '', hours: '', about: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings/practice')
      .then(r => r.json())
      .then(d => setForm(f => ({ ...f, ...d })))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/settings/practice', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  type FormKey = keyof typeof form;
  const field = (label: string, key: FormKey, opts?: { type?: string; placeholder?: string; span?: 'full' | 'half'; textarea?: boolean }) => (
    <div className={opts?.span === 'half' ? '' : 'col-span-2'}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {opts?.textarea ? (
        <textarea rows={3} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={opts?.placeholder}
          className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none" />
      ) : (
        <input type={opts?.type ?? 'text'} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={opts?.placeholder}
          className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
      )}
    </div>
  );

  if (loading) return <Spinner />;

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><h3 className="font-semibold text-foreground">Basic Information</h3></div>
        <div className="px-5 py-5 grid grid-cols-2 gap-4">
          {field('Practice Name', 'name', { placeholder: 'Akaal Psychiatry' })}
          {field('Tagline', 'tagline', { placeholder: 'Compassionate Mental Health Care' })}
          {field('Phone Number', 'phone', { type: 'tel', placeholder: '(214) 603-3091', span: 'half' })}
          {field('Email Address', 'email', { type: 'email', placeholder: 'info@akaalpsychiatry.com', span: 'half' })}
          {field('Office Hours', 'hours', { placeholder: 'Mon–Fri 9am–5pm' })}
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><h3 className="font-semibold text-foreground">Office Address</h3></div>
        <div className="px-5 py-5 grid grid-cols-2 gap-4">
          {field('Street Address', 'address', { placeholder: '123 Main St, Suite 100' })}
          {field('City', 'city', { placeholder: 'Dallas', span: 'half' })}
          {field('State', 'state', { placeholder: 'TX', span: 'half' })}
          {field('ZIP Code', 'zip', { placeholder: '75001', span: 'half' })}
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">About the Practice</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Used in patient communications and the website.</p>
        </div>
        <div className="px-5 py-5">
          {field('About', 'about', { textarea: true, placeholder: 'Brief description of your practice, specialties, and approach to care...' })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Changes
        </button>
        {saved && <span className="flex items-center gap-1.5 text-sm text-green-600"><CheckCircle2 className="w-4 h-4" />Saved</span>}
      </div>
    </form>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab() {
  const [settings, setSettings] = useState({
    notify_on_inquiry: true, notify_on_appointment: true,
    new_inquiry_emails: [] as string[], new_appointment_emails: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newInquiryEmail, setNewInquiryEmail] = useState('');
  const [newApptEmail, setNewApptEmail] = useState('');

  useEffect(() => {
    fetch('/api/settings/notifications')
      .then(r => r.json()).then(d => setSettings(s => ({ ...s, ...d }))).finally(() => setLoading(false));
  }, []);

  async function save(updated: typeof settings) {
    setSaving(true);
    await fetch('/api/settings/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  function addEmail(type: 'inquiry' | 'appt') {
    const email = (type === 'inquiry' ? newInquiryEmail : newApptEmail).trim();
    if (!email || !email.includes('@')) return;
    const key = type === 'inquiry' ? 'new_inquiry_emails' : 'new_appointment_emails';
    if (settings[key].includes(email)) return;
    const updated = { ...settings, [key]: [...settings[key], email] };
    setSettings(updated); save(updated);
    if (type === 'inquiry') setNewInquiryEmail(''); else setNewApptEmail('');
  }
  function removeEmail(type: 'inquiry' | 'appt', email: string) {
    const key = type === 'inquiry' ? 'new_inquiry_emails' : 'new_appointment_emails';
    const updated = { ...settings, [key]: settings[key].filter((e: string) => e !== email) };
    setSettings(updated); save(updated);
  }
  function toggle(key: 'notify_on_inquiry' | 'notify_on_appointment') {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated); save(updated);
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      {(saved || saving) && (
        <div className={`px-4 py-3 text-sm rounded-xl flex items-center gap-2 ${saved ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Saved'}
        </div>
      )}
      {(['inquiry', 'appt'] as const).map(type => {
        const isInquiry = type === 'inquiry';
        const label = isInquiry ? 'New Contact Form Submission' : 'New Appointment Request';
        const emails = isInquiry ? settings.new_inquiry_emails : settings.new_appointment_emails;
        const toggleKey = isInquiry ? 'notify_on_inquiry' : 'notify_on_appointment';
        const newVal = isInquiry ? newInquiryEmail : newApptEmail;
        const setNew = isInquiry ? setNewInquiryEmail : setNewApptEmail;
        return (
          <div key={type} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Staff who receive an email when this event occurs.</p>
              </div>
              <button onClick={() => toggle(toggleKey)}>
                {settings[toggleKey] ? <ToggleRight className="w-8 h-8 text-green-500" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
              </button>
            </div>
            <div className="px-5 py-4 space-y-2">
              {emails.length === 0 && <p className="text-xs text-muted-foreground">No recipients added yet.</p>}
              {emails.map(email => (
                <div key={email} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{email}</span>
                  <button onClick={() => removeEmail(type, email)} className="text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <input type="email" value={newVal} onChange={e => setNew(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmail(type))}
                  placeholder="Add staff email"
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                <button type="button" onClick={() => addEmail(type)}
                  className="px-3 py-2 bg-primary text-primary-foreground text-sm rounded-xl hover:bg-primary/90 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Integrations Tab ─────────────────────────────────────────────────────────

function IntegrationsTab() {
  const [crm, setCrm] = useState<'checking' | 'connected' | 'error'>('checking');
  const [appt, setAppt] = useState<'checking' | 'connected' | 'not_configured'>('checking');

  useEffect(() => {
    fetch('/api/contacts?limit=1').then(r => setCrm(r.ok ? 'connected' : 'error')).catch(() => setCrm('error'));
    fetch('/api/appointments?limit=1').then(r => setAppt(r.ok ? 'connected' : 'not_configured')).catch(() => setAppt('not_configured'));
  }, []);

  const items = [
    { label: 'CRM — Contacts & Messaging', desc: 'Patient contacts, form submissions, SMS conversations', status: crm, msgs: { checking: 'Checking…', connected: 'Connected', error: 'Not connected' } },
    { label: 'Appointments & Calendar', desc: 'Booking calendar and appointment management', status: appt, msgs: { checking: 'Checking…', connected: 'Connected', not_configured: 'Calendar not configured' } },
  ] as const;

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.label} className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4">
          {item.status === 'checking' ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />
            : item.status === 'connected' ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
          </div>
          <span className={`text-xs flex-shrink-0 ${item.status === 'connected' ? 'text-green-600' : item.status === 'checking' ? 'text-muted-foreground' : 'text-red-500'}`}>
            {(item.msgs as Record<string, string>)[item.status]}
          </span>
        </div>
      ))}
      <p className="text-xs text-muted-foreground px-1 pt-2">Integration credentials are managed securely and are not displayed here.</p>
    </div>
  );
}

// ─── Staff Tab ────────────────────────────────────────────────────────────────

interface StaffUser {
  id: number; email: string; name: string;
  role: 'super_admin' | 'admin' | 'staff' | 'readonly';
  is_active: boolean; last_login_at: string | null; created_at: string;
}

const ROLE_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400', icon: Crown },
  admin:       { label: 'Admin',       color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',         icon: ShieldCheck },
  staff:       { label: 'Staff',       color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',     icon: UserCog },
  readonly:    { label: 'Read Only',   color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',            icon: Eye },
};

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role] ?? ROLE_META.readonly;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
      <Icon className="w-3 h-3" />{meta.label}
    </span>
  );
}

function StaffTab() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'staff' | 'readonly'>('staff');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/users');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true); setError(null);
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: newEmail, name: newName, role: newRole }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSubmitting(false); return; }
    setUsers(p => [...p, data]); setNewName(''); setNewEmail(''); setNewRole('staff'); setShowAdd(false);
    setSuccess(`${data.name} added.`); setTimeout(() => setSuccess(null), 4000);
    setSubmitting(false);
  }

  async function toggleActive(user: StaffUser) {
    const res = await fetch(`/api/users/${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !user.is_active }) });
    if (res.ok) { const u = await res.json(); setUsers(p => p.map(x => x.id === user.id ? { ...x, is_active: u.is_active } : x)); }
  }

  async function changeRole(user: StaffUser, role: string) {
    const res = await fetch(`/api/users/${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    if (res.ok) { const u = await res.json(); setUsers(p => p.map(x => x.id === user.id ? { ...x, role: u.role } : x)); }
  }

  async function removeUser(user: StaffUser) {
    if (!confirm(`Remove ${user.name}? They will lose access immediately.`)) return;
    const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
    if (res.ok) { setUsers(p => p.filter(u => u.id !== user.id)); setSuccess(`${user.name} removed.`); setTimeout(() => setSuccess(null), 4000); }
    else { const d = await res.json(); setError(d.error); setTimeout(() => setError(null), 5000); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Team members with access to this portal.</p>
        <button onClick={() => { setShowAdd(v => !v); setError(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />Add Team Member
        </button>
      </div>

      {success && <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm rounded-xl">{success}</div>}
      {error   && <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl">{error}</div>}

      {showAdd && (
        <div className="bg-card border border-primary/30 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border"><Plus className="w-4 h-4 text-primary" /><h2 className="font-semibold text-foreground">New Team Member</h2></div>
          <form onSubmit={handleAdd} className="px-5 py-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Dr. Sarah Jones" required
                  className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Google Email</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="sarah@akaalpsychiatry.com" required
                  className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['admin', 'staff', 'readonly'] as const).map(r => {
                  const meta = ROLE_META[r]; const Icon = meta.icon;
                  return (
                    <button key={r} type="button" onClick={() => setNewRole(r)}
                      className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-sm font-medium transition-all ${newRole === r ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                      <Icon className="w-4 h-4" />{meta.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {newRole === 'admin' && 'Full access — can manage team members and all content.'}
                {newRole === 'staff' && 'Can view and update patient records, appointments, and messages.'}
                {newRole === 'readonly' && 'Can view records only. Cannot make changes.'}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Add Member
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setError(null); }}
                className="px-5 py-2.5 text-sm text-muted-foreground border border-border rounded-xl hover:border-primary/30 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Team Members</h2>
          <span className="ml-auto text-xs text-muted-foreground">{users.length} {users.length === 1 ? 'member' : 'members'}</span>
        </div>
        {loading ? <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" />Loading…</div>
          : users.length === 0 ? <div className="text-center py-10 text-sm text-muted-foreground">No team members yet.</div>
          : (
          <div className="divide-y divide-border">
            {users.map(user => (
              <div key={user.id} className={`flex items-center gap-4 px-5 py-4 ${!user.is_active ? 'opacity-50' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">{user.name}</span>
                    <RoleBadge role={user.role} />
                    {!user.is_active && <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">Suspended</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Last login: {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}</p>
                </div>
                {user.role !== 'super_admin' && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <select value={user.role} onChange={e => changeRole(user, e.target.value)}
                      className="text-xs bg-background border border-border rounded-lg px-2 py-1.5 text-muted-foreground focus:outline-none focus:border-primary transition-colors">
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="readonly">Read Only</option>
                    </select>
                    <button onClick={() => toggleActive(user)} title={user.is_active ? 'Suspend' : 'Restore'}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                      {user.is_active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => removeUser(user)} title="Remove" className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-muted/30 border border-border rounded-2xl px-5 py-4">
        <p className="text-xs font-medium text-muted-foreground mb-3">Role Permissions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-start gap-2"><Crown className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" /><span><strong className="text-foreground">Super Admin</strong> — Full access, manage all team members</span></div>
          <div className="flex items-start gap-2"><ShieldCheck className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" /><span><strong className="text-foreground">Admin</strong> — Full access, manage staff</span></div>
          <div className="flex items-start gap-2"><UserCog className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" /><span><strong className="text-foreground">Staff</strong> — View and update records</span></div>
          <div className="flex items-start gap-2"><Eye className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" /><span><strong className="text-foreground">Read Only</strong> — View records only</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── Spinner helper ───────────────────────────────────────────────────────────

function Spinner() {
  return <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>;
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export function AdminSettingsPage() {
  const [tab, setTab] = useState<TabId>('profile');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">Manage your practice details, team, and portal preferences.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-muted/40 border border-border rounded-xl p-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                tab === t.id
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'profile'       && <ProfileTab />}
      {tab === 'team'          && <StaffTab />}
      {tab === 'practice'      && <PracticeTab />}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'integrations'  && <IntegrationsTab />}
    </div>
  );
}
