'use client';

import { useEffect, useRef, useState } from 'react';

export default function ClockDate() {
  const [now, setNow] = useState(null);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    setNow(new Date());

    // align the first tick to the next minute boundary, then update once a
    // minute after that — no need for per-second updates since we only
    // display hours:minutes
    const msToNextMinute = 60000 - (Date.now() % 60000);
    timeoutRef.current = setTimeout(() => {
      setNow(new Date());
      intervalRef.current = setInterval(() => setNow(new Date()), 60000);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
    };
  }, []);

  if (!now) return null;

  const time = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      <div className="font-mono font-light text-7xl tabular glow tracking-tight">
        {time}
      </div>
      <div className="mt-2 text-lg text-dim tracking-wide">{date}</div>
    </div>
  );
}
