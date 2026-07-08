'use client';

const WEEKS = 20; // wider window since this now spans the full screen width

function buildWeekColumns(byDate, weeks) {
  const today = new Date();
  const todayDow = today.getDay();
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - todayDow));

  const columns = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(end);
      date.setDate(date.getDate() - w * 7 - (6 - d));
      const key = date.toISOString().slice(0, 10);
      col.push({ key, done: Boolean(byDate[key]), isFuture: date > today });
    }
    columns.push(col);
  }
  return columns;
}

function computeStreak(byDate) {
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (byDate[key]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export default function MiniHeatmap({ label, byDate, placeholder }) {
  const columns = buildWeekColumns(byDate, WEEKS);
  const streak = computeStreak(byDate);

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-sm text-ink/80 lowercase tracking-wide">{label}</div>
        <div className="text-xs text-dim">
          <span className="text-ink/70 tabular">{streak}</span> day streak
        </div>
      </div>

      <div className="flex gap-2.5 w-full">
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-2.5 flex-1">
            {col.map((cell, di) => (
              <div
                key={di}
                className="w-full aspect-square rounded-full"
                style={{
                  backgroundColor: cell.isFuture
                    ? 'transparent'
                    : cell.done
                    ? '#8FB9FF'
                    : 'rgba(255,255,255,0.06)',
                  boxShadow: !cell.isFuture && cell.done ? '0 0 6px rgba(143,185,255,0.5)' : 'none',
                }}
                title={cell.key}
              />
            ))}
          </div>
        ))}
      </div>

      {placeholder && (
        <div className="mt-2 text-[10px] text-faint">Placeholder data</div>
      )}
    </div>
  );
}
