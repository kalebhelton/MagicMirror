import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const location = process.env.WEATHER_LOCATION || 'Morgantown,WV,US';

  if (!apiKey) {
    return NextResponse.json({
      error: 'No OpenWeather API key',
      temp: null, description: null, humidity: null, feelsLike: null
    });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=imperial`;
    const res = await fetch(url); // weather is cached by 15min interval on client
    const data = await res.json();

    return NextResponse.json({
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      location: data.name,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, temp: null });
  }
}
