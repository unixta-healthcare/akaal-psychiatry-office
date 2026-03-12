'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, RefreshCw, ChevronLeft, ChevronRight, User, Clock, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  contactId: string;
  lastMessageType?: string;
  lastMessageDate?: string;
  unreadCount?: number;
  type?: string;
  contact?: { id: string; name: string; email: string; phone: string };
}

export function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const LIMIT = 25;

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/messages?page=${p}&limit=${LIMIT}`);
      const data = await res.json() as { conversations?: Conversation[]; total?: number; error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to fetch messages');
      setConversations(data.conversations || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(page); }, [fetchData, page]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-5 h-5 text-secondary" />
            <h1 className="text-2xl font-bold text-foreground">Messages</h1>
            {total > 0 && (
              <span className="px-2 py-0.5 text-xs bg-secondary/10 text-secondary rounded-full font-medium">
                {total} conversations
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Patient conversations and SMS</p>
        </div>
        <button
          onClick={() => fetchData(page)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-18 bg-muted rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && !error && conversations.length === 0 && (
        <div className="text-center py-20">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No conversations found. Messaging integration may need to be configured in Settings.</p>
        </div>
      )}

      {!loading && conversations.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {conversations.map((conv, i) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(conv.contact?.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground truncate">
                    {conv.contact?.name || conv.contactId || 'Unknown'}
                  </span>
                  {conv.lastMessageDate && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {new Date(conv.lastMessageDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                    {conv.type === 'sms' ? (
                      <><Send className="w-3 h-3 flex-shrink-0" /> SMS</>
                    ) : conv.lastMessageType || 'Message'}
                  </p>
                  {conv.unreadCount != null && conv.unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-xs bg-primary text-white rounded-full font-medium flex-shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
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

      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-400">
        <strong>Note:</strong> Full 2-way messaging (send/receive) requires the Conversations API scope. View-only mode is active.
      </div>
    </div>
  );
}
