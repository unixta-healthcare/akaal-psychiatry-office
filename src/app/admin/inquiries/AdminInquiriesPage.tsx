'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox, Search, RefreshCw, ChevronLeft, ChevronRight,
  Mail, Phone, MessageSquare, Clock, User, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Submission {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  others?: Record<string, string>;
  fieldData?: Array<{ id: string; name: string; fieldValue: string | string[] }>;
  createdAt: string;
  [key: string]: unknown;
}

const META_KEYS = new Set([
  'id', 'formId', 'contactId', 'locationId', 'submittedAt',
  'createdAt', 'updatedAt', 'status', 'fingerprint', '__typename',
  'contactSessionIds', 'pageUrl',
]);

function pickField(sub: Submission, ...candidates: string[]): string {
  for (const key of candidates) {
    // Top-level field
    const val = (sub as Record<string, unknown>)[key];
    if (typeof val === 'string' && val.trim()) return val.trim();
    // others object
    if (sub.others && typeof sub.others[key] === 'string' && sub.others[key].trim()) {
      return sub.others[key].trim();
    }
    // fieldData array — match by name (case-insensitive)
    if (sub.fieldData) {
      const fd = sub.fieldData.find(f => f.name.toLowerCase() === key.toLowerCase());
      if (fd) {
        const fv = Array.isArray(fd.fieldValue) ? fd.fieldValue.join(', ') : String(fd.fieldValue);
        if (fv.trim()) return fv.trim();
      }
    }
  }
  return '';
}

function allUserFields(sub: Submission): Array<{ key: string; value: string }> {
  const result: Array<{ key: string; value: string }> = [];
  const seen = new Set<string>();

  const add = (key: string, value: string) => {
    if (!META_KEYS.has(key) && !seen.has(key) && value.trim()) {
      seen.add(key);
      result.push({ key, value: value.trim() });
    }
  };

  // Top-level fields
  for (const [key, val] of Object.entries(sub)) {
    if (typeof val === 'string') add(key, val);
  }

  // others object
  if (sub.others) {
    for (const [key, val] of Object.entries(sub.others)) {
      if (typeof val === 'string') add(key, val);
    }
  }

  // fieldData array (Markyy's canonical field storage)
  if (sub.fieldData) {
    for (const fd of sub.fieldData) {
      const fv = Array.isArray(fd.fieldValue) ? fd.fieldValue.join(', ') : String(fd.fieldValue);
      add(fd.name, fv);
    }
  }

  return result;
}

// Ordered deduplicating key set (preserves first-seen insertion order)
class LinkedKeySet {
  private _keys: string[] = [];
  private _set = new Set<string>();
  add(k: string) { if (!this._set.has(k)) { this._set.add(k); this._keys.push(k); } }
  keys() { return this._keys; }
}

export function AdminInquiriesPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const LIMIT = 25;

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/inquiries?page=${p}&limit=${LIMIT}`);
      const data = await res.json() as { submissions?: Submission[]; total?: number; error?: string; forms?: Array<{ id: string; name: string }> };
      if (!res.ok) throw new Error(data.error || 'Failed to fetch inquiries');
      setSubmissions(data.submissions || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(page); }, [fetchData, page]);

  const exportCSV = () => {
    if (!submissions.length) return;
    const headers = ['Date', 'Name', 'Email', 'Phone', 'Message'];
    const rows = submissions.map(s => [
      new Date(s.createdAt).toLocaleDateString(),
      pickField(s, 'name', 'full_name', 'fullName'),
      pickField(s, 'email', 'email_address'),
      pickField(s, 'phone', 'phone_number', 'phoneNumber'),
      pickField(s, 'message', 'Message'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Inbox className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Inquiries</h1>
            {total > 0 && (
              <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium">
                {total} total
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Contact form submissions</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-muted rounded-lg p-1 gap-1">
            <button
              onClick={() => setView('cards')}
              className={cn('px-3 py-1.5 text-xs rounded-md font-medium transition-all', view === 'cards' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              Cards
            </button>
            <button
              onClick={() => setView('table')}
              className={cn('px-3 py-1.5 text-xs rounded-md font-medium transition-all', view === 'table' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              Table
            </button>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => fetchData(page)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && submissions.length === 0 && (
        <div className="text-center py-20">
          <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No inquiries found. Contact form integration may need to be configured in Settings.</p>
        </div>
      )}

      {/* Cards view */}
      {!loading && view === 'cards' && (
        <motion.div layout className="space-y-3">
          <AnimatePresence>
            {submissions.map((sub) => {
              const name = pickField(sub, 'name', 'full_name', 'fullName') || 'Unknown';
              const email = pickField(sub, 'email', 'email_address');
              const phone = pickField(sub, 'phone', 'phone_number', 'phoneNumber');
              const message = pickField(sub, 'message', 'Message');
              const isExpanded = expanded === sub.id;

              return (
                <motion.div
                  key={sub.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors"
                >
                  <button
                    onClick={() => setExpanded(isExpanded ? null : sub.id)}
                    className="w-full text-left p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {email && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="w-3 h-3" /> {email}
                              </span>
                            )}
                            {phone && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3" /> {phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <ChevronRight className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200', isExpanded && 'rotate-90')} />
                      </div>
                    </div>
                    {message && (
                      <p className={cn('mt-3 text-sm text-muted-foreground', !isExpanded && 'line-clamp-2')}>
                        <MessageSquare className="w-3 h-3 inline mr-1 opacity-60" />
                        {message}
                      </p>
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border overflow-hidden"
                      >
                        <div className="p-5 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                          {allUserFields(sub).map(({ key, value }) => (
                            <div key={key} className="flex gap-2 text-sm">
                              <span className="text-muted-foreground capitalize min-w-[120px] flex-shrink-0">{key.replace(/_/g, ' ')}:</span>
                              <span className="text-foreground font-medium break-words flex-1">{value}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Table view — dynamic columns derived from all submissions */}
      {!loading && view === 'table' && submissions.length > 0 && (() => {
        // Build ordered unique column list from all submissions
        const colSet = new LinkedKeySet();
        submissions.forEach(sub => allUserFields(sub).forEach(({ key }) => colSet.add(key)));
        const cols = colSet.keys();

        // Build per-submission field maps for O(1) lookup
        const fieldMaps = submissions.map(sub => {
          const m: Record<string, string> = {};
          allUserFields(sub).forEach(({ key, value }) => { m[key] = value; });
          return m;
        });

        return (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="text-sm" style={{ minWidth: `${Math.max(700, (cols.length + 2) * 160)}px` }}>
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="w-8 px-3 py-3" />
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Date</th>
                    {cols.map(col => (
                      <th key={col} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap capitalize">
                        {col.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub, idx) => {
                    const isExpanded = expanded === sub.id;
                    const fm = fieldMaps[idx];
                    return (
                      <tr
                        key={sub.id}
                        onClick={() => setExpanded(isExpanded ? null : sub.id)}
                        className={`border-t border-border cursor-pointer transition-colors ${isExpanded ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/30'}`}
                      >
                        <td className="px-3 py-3 text-muted-foreground">
                          <ChevronRight className={cn('w-3.5 h-3.5 transition-transform duration-200', isExpanded && 'rotate-90')} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        {cols.map(col => (
                          <td key={col} className="px-4 py-3 text-foreground max-w-[220px] truncate" title={fm[col] ?? ''}>
                            {fm[col] || <span className="text-muted-foreground/40">—</span>}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-foreground px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer note */}
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
        <Search className="w-3 h-3" />
        <span>Showing contact us form submissions from akaalpsychiatry.com</span>
      </div>
    </div>
  );
}
