'use client';
import { useState, useEffect } from 'react';

interface CalEvent { id: string; title: string; start: string; allDay: boolean; }

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarWidget() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayDate = today.getDate();

  useEffect(() => {
    fetch('/api/calendar')
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        setEvents(data.events || []);
      });
  }, []);

  // Map events to day numbers for this month
  const eventsByDay: Record<number, CalEvent[]> = {};
  events.forEach(e => {
    const d = new Date(e.start);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(e);
    }
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{width:'100%'}}>
      <h3 style={{fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'2px',color:'rgba(255,255,255,0.35)',marginBottom:'12px'}}>
        Calendar
      </h3>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
        <span style={{fontSize:'1.1rem',fontWeight:400}}>{MONTH_NAMES[month]} {year}</span>
        {error && <span style={{fontSize:'0.7rem',color:'#ff6b6b'}}>{error.slice(0,50)}</span>}
      </div>

      {/* Day headers */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px',marginBottom:'4px'}}>
        {DAY_NAMES.map(d => (
          <div key={d} style={{fontSize:'0.65rem',color:'rgba(255,255,255,0.35)',textAlign:'center',padding:'4px 0'}}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px'}}>
        {cells.map((day, i) => (
          <div key={i} style={{
            minHeight: '64px',
            borderRadius: '6px',
            padding: '4px 6px',
            background: day === todayDate ? 'rgba(255,255,255,0.08)' : 'transparent',
            border: day === todayDate ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
          }}>
            {day && (
              <>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: day === todayDate ? 700 : 400,
                  color: day === todayDate ? '#fff' : 'rgba(255,255,255,0.6)',
                  marginBottom: '3px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: day === todayDate ? '#fff' : 'transparent',
                  color: day === todayDate ? '#000' : 'rgba(255,255,255,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {day}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
                  {(eventsByDay[day] || []).slice(0, 3).map(e => (
                    <div key={e.id} style={{
                      fontSize: '0.6rem',
                      background: '#1a73e8',
                      borderRadius: '3px',
                      padding: '1px 4px',
                      color: '#fff',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}>
                      {e.allDay ? e.title : `${new Date(e.start).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true})} ${e.title}`}
                    </div>
                  ))}
                  {(eventsByDay[day] || []).length > 3 && (
                    <div style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.4)'}}>
                      +{(eventsByDay[day] || []).length - 3} more
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}