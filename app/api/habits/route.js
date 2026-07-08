import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

// Checkbox properties in the "Habit Log" Notion database, in display order.
// Add/remove/reorder habits here — the frontend renders one heatmap per entry.
const HABITS = ['Workout / Physical Activity', 'Reading / Audiobooks / Podcasts', 'Latte Art', 'Knitting', 'Coding / Personal Projects', 'Socializing'];

async function queryDatabase(databaseId, apiKey, filter, startCursor) {
  const { data } = await axios.post(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    { filter, start_cursor: startCursor },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );
  return data;
}

export async function GET() {
  const { NOTION_API_KEY, NOTION_DATABASE_ID } = process.env;

  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    return NextResponse.json(
      { error: 'Missing NOTION_API_KEY or NOTION_DATABASE_ID in .env.local', byDate: {} },
      { status: 500 }
    );
  }

  try {
    const since = new Date();
    since.setDate(since.getDate() - 14 * 7); // ~14 weeks of history

    const filter = {
      property: 'Date',
      date: { on_or_after: since.toISOString().slice(0, 10) },
    };

    const results = [];
    let cursor = undefined;

    do {
      const res = await queryDatabase(NOTION_DATABASE_ID, NOTION_API_KEY, filter, cursor);
      results.push(...res.results);
      cursor = res.has_more ? res.next_cursor : undefined;
    } while (cursor);

    // byDate: { "2026-07-08": { Workout: true, Reading: false, ... } }
    const byDate = {};
    for (const page of results) {
      const dateProp = page.properties['Date']?.date?.start;
      if (!dateProp) continue;
      const key = dateProp.slice(0, 10);

      const entry = {};
      for (const habit of HABITS) {
        entry[habit] = Boolean(page.properties[habit]?.checkbox);
      }
      byDate[key] = entry;
    }

    return NextResponse.json({ habits: HABITS, byDate });
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    console.error('Notion API error:', message);
    return NextResponse.json({ error: message, byDate: {} }, { status: 500 });
  }
}
