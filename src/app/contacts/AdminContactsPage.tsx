'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, RefreshCw, ChevronLeft, ChevronRight, Mail, Phone, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tags?: string[];
  dateAdded?: string;
  source?: string;
}

export function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const LIMIT = 25;

  const fetchData = useCallback(async (p: number, q: string) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (q) params.set('q', q);
    try {
      const res = await fetch(`/api/contacts?${params}`);
      const data = await res.json() as { contacts?: Contact[]; total?: number; error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to fetch contacts');
      setContacts(data.contacts || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(page, query); }, [fetchData, page, query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(inputValue);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-accent" />
            <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
            {total > 0 && (
              <span className="px-2 py-0.5 text-xs bg-accent/10 text-accent rounded-full font-medium">
                {total.toLocaleString()} total
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Patient contact directory</p>
        </div>
        <button
          onClick={() => fetchData(page, query)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => { setInputValue(''); setQuery(''); setPage(1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
          >
            Clear
          </button>
        )}
      </form>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && !error && contacts.length === 0 && (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{query ? `No contacts found for "${query}"` : 'No contacts found.'}</p>
        </div>
      )}

      {!loading && contacts.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tags</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contacts.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-tertiary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(c.firstName || c.lastName || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">
                          {[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.email ? (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          {c.email}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {c.phone ? (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          {c.phone}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {c.tags && c.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {c.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-muted rounded-md text-muted-foreground">
                              <Tag className="w-2.5 h-2.5" />
                              {tag}
                            </span>
                          ))}
                          {c.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{c.tags.length - 3}</span>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{c.source || '—'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-foreground px-2">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
