/**
 * GET /api/admin/appointments
 * Returns calendar appointments.
 *
 * Query params:
 *   startDate  — ISO date string (default: today)
 *   endDate    — ISO date string (default: 30 days from today)
 *   calendarId — optional specific calendar ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAppointments, getCalendars } from '@/lib/ghl';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const now = new Date();
  const thirtyDaysLater = new Date(now);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  const startDate = searchParams.get('startDate') || now.toISOString();
  const endDate = searchParams.get('endDate') || thirtyDaysLater.toISOString();
  const calendarId = searchParams.get('calendarId') || process.env.MARKYY_CALENDAR_ID || undefined;

  try {
    const [events, calendars] = await Promise.all([
      getAppointments(startDate, endDate, calendarId),
      getCalendars(),
    ]);

    return NextResponse.json({ events, calendars, startDate, endDate });
  } catch (err) {
    console.error('[api/admin/appointments]', err);
    return NextResponse.json(
      { error: 'Failed to fetch appointments', details: String(err) },
      { status: 500 }
    );
  }
}
