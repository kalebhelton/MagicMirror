"use client";

import { useEffect, useState } from "react";

type Weather = {
  temp: number;
  feelsLike: number;
  condition: string;
  description: string;
  icon: string;
  city: string;
};

const ICON_MAP: Record<string, string> = {
  "01d": "☀️",
  "01n": "🌙",
  "02d": "⛅",
  "02n": "☁️",
  "03d": "☁️",
  "03n": "☁️",
  "04d": "☁️",
  "04n": "☁️",
  "09d": "🌧️",
  "09n": "🌧️",
  "10d": "🌦️",
  "10n": "🌦️",
  "11d": "⛈️",
  "11n": "⛈️",
  "13d": "❄️",
  "13n": "❄️",
  "50d": "🌫️",
  "50n": "🌫️",
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = () => {
      fetch("/api/weather")
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setWeather(data);
            setError(null);
          }
        })
        .catch(() => setError("Could not load weather"));
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000); // every 10 min
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <div className="text-white/text-3xl">{error}</div>;
  }

  if (!weather) {
    return <div className="text-white/ text-3xl">Loading weather…</div>;
  }

  return (
    <div className="text-white text-right">
      <div className="flex items-center justify-end gap-2">
        <span className="text-5xl">{ICON_MAP[weather.icon] || "🌡️"}</span>
        <span className="text-5xl font-light">{weather.temp}°</span>
      </div>
      <div className="text-white/ capitalize text-3xl mt-1">{weather.description}</div>
      <div className="text-white/ text-2xl">{weather.city}</div>
    </div>
  );
}
