'use client';

import { useEffect, useMemo, useState } from 'react';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MAX_VISIBLE_EVENTS = 3;

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// All-day events come back as date-only strings ("2026-07-08") with no
// timezone. Parsing that directly with `new Date()` treats it as UTC
// midnight, which shifts a day earlier in any timezone behind UTC. Parse
// the Y/M/D components ourselves so it lands on the correct local day.
function getEventLocalDate(event) {
  if (event.allDay) {
    const [y, m, d] = event.start.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(event.start);
}

function formatEventTime(event) {
  if (event.allDay) return null;
  return new Date(event.start).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: event.start.includes(':00:00') ? undefined : '2-digit',
  });
}

export default function CalendarMonth() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(false);
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const load = () => {
      fetch('/api/calendar')
        .then((r) => r.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setEvents(data.events || []);
          setError(false);
        })
        .catch(() => setError(true));
    };

    load();
    const id = setInterval(load, 10 * 60 * 1000); // refresh every 10 min
    return () => clearInterval(id);
  }, []);

  // check once a minute whether the calendar day has changed (midnight
  // rollover) so a kiosk display that never reloads still highlights the
  // correct day
  useEffect(() => {
    const id = setInterval(() => {
      setToday((prev) => {
        const now = new Date();
        return now.getDate() !== prev.getDate() ||
          now.getMonth() !== prev.getMonth() ||
          now.getFullYear() !== prev.getFullYear()
          ? now
          : prev;
      });
    }, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const year = today.getFullYear();
  const month = today.getMonth();
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const eventsByDay = useMemo(() => {
    const map = {};
    for (const e of events) {
      const d = getEventLocalDate(e);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        map[day] = map[day] || [];
        map[day].push(e);
      }
    }
    // all-day events first, then sorted by start time, matching Google's own ordering
    for (const day in map) {
      map[day].sort((a, b) => {
        if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
        return new Date(a.start) - new Date(b.start);
      });
    }
    return map;
  }, [events, year, month]);

  const monthLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (error) {
    return (
      <div className="w-full">
        <div className="text-sm tracking-widest2 uppercase text-dim mb-4">{monthLabel}</div>
        <div className="text-dim text-sm">Calendar unavailable</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-sm tracking-widest2 uppercase text-dim mb-3">{monthLabel}</div>

      <div className="grid grid-cols-7 border-t border-l hairline">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-[11px] tracking-wide text-dim text-center py-2 border-r border-b hairline"
          >
            {label}
          </div>
        ))}

        {cells.map((day, i) => {
          const isToday = day === today.getDate();
          const dayEvents = day ? eventsByDay[day] || [] : [];
          const visible = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
          const overflow = dayEvents.length - visible.length;

          return (
            <div
              key={i}
              className="border-r border-b hairline min-h-[92px] px-1.5 py-1.5 flex flex-col gap-0.5"
            >
              {day && (
                <>
                  <span
                    className={
                      isToday
                        ? 'w-6 h-6 flex items-center justify-center rounded-full bg-accent text-black text-xs font-medium mb-0.5'
                        : 'text-xs text-ink/70 mb-0.5 pl-0.5'
                    }
                  >
                    {day}
                  </span>

                  {visible.map((e) => {
                    const time = formatEventTime(e);
                    return (
                      <div
                        key={e.id}
                        className="text-[10.5px] leading-tight px-1.5 py-0.5 rounded truncate"
                        style={{
                          backgroundColor: `${e.color}26`,
                          borderLeft: `2px solid ${e.color}`,
                          color: '#EDEDED',
                        }}
                        title={e.title}
                      >
                        {time && <span className="text-dim mr-1 tabular">{time}</span>}
                        {e.title}
                      </div>
                    );
                  })}

                  {overflow > 0 && (
                    <div className="text-[10.5px] text-dim pl-1.5">+{overflow} more</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
