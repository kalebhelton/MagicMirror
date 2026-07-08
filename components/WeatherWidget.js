'use client';

import { useEffect, useState } from 'react';

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = () => {
      fetch('/api/weather')
        .then((r) => r.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setWeather(data);
          setError(false);
        })
        .catch(() => setError(true));
    };

    load();
    const id = setInterval(load, 60 * 60 * 1000); // refresh every hour
    return () => clearInterval(id);
  }, []);

  if (error) {
    return <div className="text-dim text-sm text-right">Weather unavailable</div>;
  }

  if (!weather) return null;

  return (
    <div className="text-right">
      <div className="font-mono font-light text-6xl tabular glow">
        {weather.tempF}°
      </div>
      <div className="mt-2 text-lg text-dim">{weather.condition}</div>
      <div className="mt-1 text-sm text-dim">
        H {weather.highF}° &nbsp;·&nbsp; L {weather.lowF}°
      </div>
    </div>
  );
}
