'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, RefreshCw, ChevronLeft, ChevronRight, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  appointmentStatus: string;
  notes?: string;
  contact?: { name: string; email: string; phone: string };
}

interface CalendarItem { id: string; name: string; }

const STATUS_STYLES: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
  confirmed:  { label: 'Confirmed',  icon: CheckCircle,  className: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  cancelled:  { label: 'Cancelled',  icon: XCircle,      className: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
  noshow:     { label: 'No-Show',    icon: AlertCircle,  className: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  new:        { label: 'Scheduled',  icon: Clock,        className: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
};

export function AdminAppointmentsPage() {
  const [events, setEvents] = useState<Appointment[]>([]);
  const [calendars, setCalendars] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCalendar, setSelectedCalendar] = useState('');

  // Date window: current week
  const [weekOffset, setWeekOffset] = useState(0);

  const getDateRange = useCallback(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() + weekOffset * 7 - start.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 30);
    return { startDate: start.toISOString(), endDate: end.toISOString(), start };
  }, [weekOffset]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { startDate, endDate } = getDateRange();
    const params = new URLSearchParams({ startDate, endDate });
    if (selectedCalendar) params.set('calendarId', selectedCalendar);

    try {
      const res = await fetch(`/api/appointments?${params}`);
      const data = await res.json() as { events?: Appointment[]; calendars?: CalendarItem[]; error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to fetch appointments');
      setEvents(data.events || []);
      setCalendars(data.calendars || []);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [getDateRange, selectedCalendar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { start } = getDateRange();
  const rangeLabel = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-secondary" />
            <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
            {events.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-secondary/10 text-secondary rounded-full font-medium">
                {events.length} shown
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">From {rangeLabel} (30 days)</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {calendars.length > 0 && (
            <select
              value={selectedCalendar}
              onChange={e => setSelectedCalendar(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-2 bg-card text-foreground"
            >
              <option value="">All calendars</option>
              {calendars.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="text-center py-20">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No appointments in this window.</p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="space-y-3">
          {events.map((event, i) => {
            const statusKey = (event.appointmentStatus || event.status || 'new').toLowerCase();
            const statusStyle = STATUS_STYLES[statusKey] || STATUS_STYLES.new;
            const StatusIcon = statusStyle.icon;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-5 hover:border-secondary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{event.title || 'Appointment'}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(event.startTime).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                          })}
                        </span>
                        {event.contact && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            {event.contact.name}
                          </span>
                        )}
                      </div>
                      {event.notes && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{event.notes}</p>
                      )}
                    </div>
                  </div>
                  <span className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0',
                    statusStyle.className
                  )}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusStyle.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
