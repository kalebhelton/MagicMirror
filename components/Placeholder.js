export default function Placeholder({ label }) {
  return (
    <div className="border hairline rounded-lg px-4 py-3 text-dim text-sm tracking-wide">
      {label}
      <span className="block text-xs text-faint mt-0.5">coming soon</span>
    </div>
  );
}
