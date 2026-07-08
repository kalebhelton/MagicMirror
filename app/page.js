import ClockDate from '../components/ClockDate';
import WeatherWidget from '../components/WeatherWidget';
import CalendarMonth from '../components/CalendarMonth';
import HabitTracker from '../components/HabitTracker';
import Placeholder from '../components/Placeholder';

export default function MirrorPage() {
  return (
    <main className="h-screen w-screen px-14 py-12 flex flex-col overflow-y-auto">
      {/* top row: date/time + weather */}
      <div className="flex justify-between items-start">
        <ClockDate />
        <WeatherWidget />
      </div>

      {/* full-width Google Calendar month view */}
      <div className="mt-12">
        <CalendarMonth />
      </div>

      {/* habit tracker: one heatmap per habit */}
      <HabitTracker />

      {/* bottom: recent transactions */}
      <div className="mt-8">
        <div className="max-w-md">
          <Placeholder label="Recent Transactions (Actual Budget)" />
        </div>
      </div>
    </main>
  );
}
