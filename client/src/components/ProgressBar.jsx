export default function ProgressBar({ percent }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div
        className="bg-indigo-600 h-3 rounded-full transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
