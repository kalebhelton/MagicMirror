import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'habits.json');

const HABITS = [
  'Workout',
  'Reading',
  'Latte Art',
  'Piano Practice',
  'Cybersecurity News',
];

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadData(): Record<string, string[]> {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

// Match Streaks CSV habit names to our display names (fuzzy)
function matchHabit(name: string): string | null {
  const lower = name.toLowerCase();
  for (const h of HABITS) {
    if (lower.includes(h.toLowerCase().split(' ')[0])) return h;
  }
  return null;
}

export async function GET() {
  const data = loadData();
  const today = new Date();
  const days: string[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const result = HABITS.map(habit => ({
    name: habit,
    days: days.map(day => ({
      date: day,
      done: !!(data[habit] && data[habit].includes(day)),
    })),
  }));

  return NextResponse.json({ habits: result, days });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const lines = body.split('\n').filter(Boolean);
    if (lines.length < 2) {
      return NextResponse.json({ error: 'Empty CSV' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = loadData();

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

      // Streaks CSV typically has: Task, Date, Completed
      const habitName = row['Task'] || row['Name'] || row['Habit'] || '';
      const dateStr = row['Date'] || row['date'] || '';
      const completed = (row['Completed'] || row['completed'] || '').toLowerCase();

      if (!habitName || !dateStr) continue;

      const matched = matchHabit(habitName);
      if (!matched) continue;

      // Normalize date to YYYY-MM-DD
      let date = dateStr;
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          // M/D/YYYY or MM/DD/YYYY
          date = `${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`;
        }
      }

      if (!data[matched]) data[matched] = [];

      if (completed === 'true' || completed === '1' || completed === 'yes') {
        if (!data[matched].includes(date)) data[matched].push(date);
      } else {
        data[matched] = data[matched].filter(d => d !== date);
      }
    }

    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return NextResponse.json({ ok: true, message: 'Habits updated' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
