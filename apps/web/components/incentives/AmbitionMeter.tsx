'use client';

import type { DailyTrack } from '@teen-alpha/database';

interface AmbitionMeterProps {
  tracks: DailyTrack[];
  currentDay: number;
}

export function AmbitionMeter({ tracks, currentDay }: AmbitionMeterProps) {
  const getSegmentColor = (track: DailyTrack | undefined, dayNum: number) => {
    if (!track || track.status !== 'completed') {
      return dayNum <= currentDay ? 'bg-gray-300' : 'bg-gray-200';
    }
    const effort = track.effort_rating || 1;
    if (effort >= 5) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (effort >= 4) return 'bg-purple-500';
    if (effort >= 3) return 'bg-indigo-500';
    if (effort >= 2) return 'bg-blue-500';
    return 'bg-blue-400';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
          const track = tracks.find((t) => t.day_number === dayNum);
          const isCompleted = track?.status === 'completed';
          const isCurrent = dayNum === currentDay;

          return (
            <div key={dayNum} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-3 rounded-full transition-all ${getSegmentColor(track, dayNum)} ${
                  isCurrent && !isCompleted ? 'ring-2 ring-indigo-400 ring-offset-1' : ''
                } ${isCompleted ? 'animate-[pulse_2s_ease-in-out_1]' : ''}`}
              />
              <span className={`text-[10px] ${isCurrent ? 'font-bold text-indigo-600' : 'text-gray-400'}`}>
                D{dayNum}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
