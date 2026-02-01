'use client';

interface DiscomfortRatingProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export function DiscomfortRating({ value, onChange, label = 'discomfort' }: DiscomfortRatingProps) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1.5">
        {label === 'effort'
          ? 'How much effort did this take?'
          : 'How far outside your comfort zone was this?'}
      </p>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              level <= value
                ? level >= 4
                  ? 'bg-orange-500 text-white scale-110'
                  : 'bg-indigo-500 text-white'
                : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
            }`}
          >
            {level}
          </button>
        ))}
      </div>
      {value >= 4 && (
        <p className="text-xs text-orange-600 mt-1 font-medium">
          Bonus points for pushing your limits!
        </p>
      )}
    </div>
  );
}
