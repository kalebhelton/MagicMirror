import { NextResponse } from 'next/server';

async function getGoogleToken(clientEmail: string, privateKey: string, scope: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const signingInput = `${encode(header)}.${encode(payload)}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    Buffer.from(privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, ''), 'base64'),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    Buffer.from(signingInput)
  );

  const jwt = `${signingInput}.${Buffer.from(signature).toString('base64url')}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const data = await res.json();
  return data.access_token;
}

export async function GET() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  if (!clientEmail || !privateKey) {
    return NextResponse.json({ error: 'Google Calendar not configured', events: [] });
  }

  try {
    const token = await getGoogleToken(
      clientEmail,
      privateKey,
      'https://www.googleapis.com/auth/calendar.readonly'
    );

    const now = new Date().toISOString();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${now}&timeMax=${future}&singleEvents=true&orderBy=startTime&maxResults=20`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();
    if (data.error) return NextResponse.json({ error: data.error.message, events: [] });

    const events = (data.items || []).map((e: Record<string, unknown> & { start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }) => ({
      id: e.id,
      title: e.summary || '(no title)',
      start: e.start?.dateTime || e.start?.date || '',
      end: e.end?.dateTime || e.end?.date || '',
      allDay: !e.start?.dateTime,
    }));

    return NextResponse.json({ events });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err), events: [] });
  }
}