'use client';

import { useEffect, useState } from 'react';
import MiniHeatmap from './MiniHeatmap';

const HABIT_LABELS = {
  'Workout / Physical Activity': 'Workout',
  'Reading / Audiobooks / Podcasts': 'Reading',
  'Latte Art': 'Latte Art',
  'Fiber Arts': 'Fiber Arts',
  'Coding / Personal Projects': 'Coding / Personal Projects',
};

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getPlaceholderByDate(habitSeed) {
  const today = new Date();
  const byDate = {};
  for (let i = 0; i < 100; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDate[key] = seededRandom(i * 7.31 + habitSeed) > 0.6;
  }
  return byDate;
}

export default function HabitTracker() {
  const [mounted, setMounted] = useState(false);
  const [habits, setHabits] = useState(Object.keys(HABIT_LABELS));
  const [byDate, setByDate] = useState(null);
  const [usingPlaceholder, setUsingPlaceholder] = useState(false);

  useEffect(() => {
    setMounted(true);

    const load = () => {
      fetch('/api/habits')
        .then((r) => r.json())
        .then((data) => {
          if (data.error || !data.byDate || Object.keys(data.byDate).length === 0) {
            throw new Error(data.error || 'no data yet');
          }
          setHabits(data.habits || Object.keys(HABIT_LABELS));
          setByDate(data.byDate);
          setUsingPlaceholder(false);
        })
        .catch(() => {
          setUsingPlaceholder(true);
        });
    };

    load();
    const id = setInterval(load, 30 * 60 * 1000); // refresh every 30 min
    return () => clearInterval(id);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full border-t hairline pt-6 mt-8">
      <div className="text-sm tracking-widest2 uppercase text-dim mb-5">Habit Tracker</div>

      <div className="flex flex-col gap-8">
        {habits.map((habit, i) => {
          const perHabitByDate = usingPlaceholder
            ? getPlaceholderByDate(i * 13)
            : Object.fromEntries(
                Object.entries(byDate || {}).map(([date, entry]) => [date, entry[habit]])
              );

          return (
            <MiniHeatmap
              key={habit}
              label={HABIT_LABELS[habit] || habit}
              byDate={perHabitByDate}
              placeholder={usingPlaceholder}
            />
          );
        })}
      </div>
    </div>
  );
}
