'use client';

import { Label } from '@/components/ui/label';
import type { ProfileCustomization, ProfileCssOverrides } from '@teen-alpha/database';

interface CssSandboxProps {
  customization: ProfileCustomization | null;
  onUpdate: (partial: Partial<ProfileCustomization>) => Promise<void>;
}

const SLIDERS: { key: keyof ProfileCssOverrides; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: 'borderRadius', label: 'Border Radius', min: 0, max: 24, step: 1, unit: 'px' },
  { key: 'cardOpacity', label: 'Card Opacity', min: 0.5, max: 1.0, step: 0.05, unit: '' },
  { key: 'headerHeight', label: 'Header Height', min: 120, max: 300, step: 10, unit: 'px' },
  { key: 'shadowIntensity', label: 'Shadow Intensity', min: 0, max: 20, step: 1, unit: 'px' },
];

const DEFAULTS: ProfileCssOverrides = {
  borderRadius: 8,
  cardOpacity: 1.0,
  headerHeight: 180,
  shadowIntensity: 4,
};

export function CssSandbox({ customization, onUpdate }: CssSandboxProps) {
  const overrides = customization?.css_overrides || {};

  const handleChange = async (key: keyof ProfileCssOverrides, value: number) => {
    const updated = { ...overrides, [key]: value };
    await onUpdate({ css_overrides: updated });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Advanced Styling</h3>
      <p className="text-sm text-gray-500">Fine-tune your profile appearance with these sliders.</p>

      <div className="space-y-5">
        {SLIDERS.map(slider => {
          const value = (overrides[slider.key] as number) ?? (DEFAULTS[slider.key] as number);
          return (
            <div key={slider.key}>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm">{slider.label}</Label>
                <span className="text-sm text-gray-500 font-mono">
                  {value}{slider.unit}
                </span>
              </div>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={value}
                onChange={e => handleChange(slider.key, parseFloat(e.target.value))}
                className="w-full accent-[#FF6B35]"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{slider.min}{slider.unit}</span>
                <span>{slider.max}{slider.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
