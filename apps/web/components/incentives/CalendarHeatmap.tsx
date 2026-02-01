'use client';

interface CalendarHeatmapProps {
  data: Array<{ date: string; alpha: number }>;
  weeks?: number;
}

function getIntensity(alpha: number, max: number): string {
  if (alpha === 0) return 'bg-gray-100';
  const ratio = alpha / max;
  if (ratio <= 0.25) return 'bg-purple-200';
  if (ratio <= 0.5) return 'bg-purple-300';
  if (ratio <= 0.75) return 'bg-purple-500';
  return 'bg-purple-700';
}

export function CalendarHeatmap({ data, weeks = 4 }: CalendarHeatmapProps) {
  const totalDays = weeks * 7;
  const today = new Date();
  const days: Array<{ date: string; alpha: number }> = [];

  const dataMap = new Map(data.map((d) => [d.date, d.alpha]));

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({ date: dateStr, alpha: dataMap.get(dateStr) ?? 0 });
  }

  const maxAlpha = Math.max(...days.map((d) => d.alpha), 1);

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <div
            key={day.date}
            className={`aspect-square rounded-sm ${getIntensity(day.alpha, maxAlpha)}`}
            title={`${day.date}: ${day.alpha} Alpha`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{weeks * 7} days</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-gray-100" />
          <div className="w-3 h-3 rounded-sm bg-purple-200" />
          <div className="w-3 h-3 rounded-sm bg-purple-300" />
          <div className="w-3 h-3 rounded-sm bg-purple-500" />
          <div className="w-3 h-3 rounded-sm bg-purple-700" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
