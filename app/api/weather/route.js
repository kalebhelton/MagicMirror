import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Open-Meteo needs no API key. Set MIRROR_LAT / MIRROR_LON in .env.local
// for your location (defaults below are placeholder coordinates).
const LAT = process.env.MIRROR_LAT || '39.6295';
const LON = process.env.MIRROR_LON || '-79.9559';

// WMO weather codes -> short label
const WEATHER_CODES = {
  0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow',
  75: 'Heavy snow', 80: 'Rain showers', 81: 'Rain showers', 82: 'Violent showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
};

export async function GET() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto`;

    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
    const data = await res.json();

    const code = data.current?.weather_code;

    return NextResponse.json({
      tempF: Math.round(data.current?.temperature_2m),
      condition: WEATHER_CODES[code] || 'Unknown',
      humidity: data.current?.relative_humidity_2m,
      highF: Math.round(data.daily?.temperature_2m_max?.[0]),
      lowF: Math.round(data.daily?.temperature_2m_min?.[0]),
    });
  } catch (err) {
    console.error('Weather API error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
