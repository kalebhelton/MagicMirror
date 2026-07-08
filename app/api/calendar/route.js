import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleAuth } from '../../../lib/googleAuth';

// keeps this route from being statically cached by Next
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    const now = new Date();
    // pull from the 1st of this month to the end of next month, so the
    // month grid always has enough events for the visible view
    const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

    const [eventsRes, colorsRes, calListRes] = await Promise.all([
      calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
      }),
      calendar.colors.get(),
      calendar.calendarList.get({ calendarId: 'primary' }),
    ]);

    // resolve each event's color the same way Google Calendar does:
    // event.colorId overrides the calendar's own default color
    const defaultColor = calListRes.data.backgroundColor || '#8FB9FF';
    const eventColorMap = colorsRes.data.event || {};

    const events = (eventsRes.data.items || []).map((e) => ({
      id: e.id,
      title: e.summary || 'Untitled',
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      allDay: Boolean(e.start?.date && !e.start?.dateTime),
      color: e.colorId ? eventColorMap[e.colorId]?.background || defaultColor : defaultColor,
    }));

    return NextResponse.json({ events });
  } catch (err) {
    console.error('Calendar API error:', err.message);
    return NextResponse.json({ error: err.message, events: [] }, { status: 500 });
  }
}
