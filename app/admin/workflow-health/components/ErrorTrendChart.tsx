'use client';

interface ErrorTrendChartProps {
  data: { [key: string]: number };
}

export function ErrorTrendChart({ data }: ErrorTrendChartProps) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) {
    return <div className="text-center text-text-secondary py-8">No trend data available</div>;
  }

  const maxCount = Math.max(...entries.map(([, count]) => count), 1);

  return (
    <div className="space-y-2">
      {entries.map(([label, count]) => (
        <div key={label} className="flex items-center gap-4">
          <span className="text-sm text-text-secondary w-24 font-mono">{label}</span>
          <div className="flex-1 bg-background-sunken rounded-lg h-8 relative overflow-hidden">
            <div
              className="h-full bg-error rounded-lg"
              style={{ width: `${(count / maxCount) * 100}%` }}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-text-primary">
              {count}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
