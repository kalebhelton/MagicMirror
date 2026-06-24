'use client';
import { useState, useEffect } from 'react';

interface HabitDay { date: string; done: boolean; }
interface Habit { name: string; days: HabitDay[]; }

export default function HabitsWidget() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    fetch('/api/habits')
      .then(r => r.json())
      .then(d => setHabits(d.habits || []));
  }, []);

  if (!habits.length) return <div className="habits-widget"><div className="not-connected">Loading habits…</div></div>;

  return (
    <div className="habits-widget">
      <h3>Habits — last 90 days</h3>
      {habits.map(habit => (
        <div key={habit.name} className="habit-row">
          <span className="habit-name">{habit.name}</span>
          <div className="habit-cells">
            {habit.days.map(day => (
              <div
                key={day.date}
                className={`habit-cell${day.done ? ' done' : ''}${day.date === today ? ' today' : ''}`}
                title={day.date}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
