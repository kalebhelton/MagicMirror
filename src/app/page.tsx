import './globals.css';
import ClockWidget from '@/components/ClockWidget';
import WeatherWidget from '@/components/WeatherWidget';
import HabitsWidget from '@/components/HabitsWidget';
import CalendarWidget from '@/components/CalendarWidget';
import TransactionsWidget from '@/components/TransactionsWidget';

export const metadata = { title: 'Smart Mirror' };

export default function Home() {
  return (
    <div className="mirror-root">
      {/* Top row: Clock + Weather */}
      <div className="top-row">
        <ClockWidget />
        <WeatherWidget />
      </div>

      {/* Middle: Habits heatmap */}
      <HabitsWidget />

      {/* Bottom: Calendar + Transactions side by side */}
      <div className="bottom-section">
        <CalendarWidget />
        <TransactionsWidget />
      </div>
    </div>
  );
}
