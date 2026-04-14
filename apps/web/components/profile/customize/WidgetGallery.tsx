'use client';

import { Smile, Eye, Sparkles, Users, Lock } from 'lucide-react';
import type { ProfileCustomization, ProfileWidget } from '@teen-alpha/database';

const WIDGET_TYPES: { type: ProfileWidget['type']; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'visitor_counter', label: 'Visitor Counter', icon: <Eye className="w-5 h-5" />, description: 'Show how many people viewed your profile' },
  { type: 'mood', label: 'Current Mood', icon: <Smile className="w-5 h-5" />, description: 'Display your current mood with an emoji' },
  { type: 'glitter_text', label: 'Glitter Text', icon: <Sparkles className="w-5 h-5" />, description: 'Add sparkly custom text to your profile' },
  { type: 'top_friends', label: 'Top Friends', icon: <Users className="w-5 h-5" />, description: 'Show your favorite people' },
];

interface WidgetGalleryProps {
  customization: ProfileCustomization | null;
  onUpdate: (partial: Partial<ProfileCustomization>) => Promise<void>;
  hasUnlock: (type: string, key: string) => boolean;
  onRequestUnlock: (type: string, key: string) => void;
}

export function WidgetGallery({ customization, onUpdate, hasUnlock, onRequestUnlock }: WidgetGalleryProps) {
  const widgets = customization?.widgets || [];
  const widgetCount = widgets.length;

  const addWidget = async (type: ProfileWidget['type']) => {
    if (widgetCount >= 4) return;

    // 3rd and 4th widgets require unlock
    if (widgetCount >= 2 && !hasUnlock('widget_slot', `slot_${widgetCount + 1}`)) {
      onRequestUnlock('widget_slot', `slot_${widgetCount + 1}`);
      return;
    }

    // Don't add duplicate types
    if (widgets.some(w => w.type === type)) return;

    const newWidget: ProfileWidget = { type, config: {} };
    await onUpdate({ widgets: [...widgets, newWidget] });
  };

  const removeWidget = async (index: number) => {
    const updated = widgets.filter((_, i) => i !== index);
    await onUpdate({ widgets: updated });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Widgets</h3>
      <p className="text-sm text-gray-500">Add up to 4 widgets to your profile ({widgetCount}/4)</p>

      {/* Active Widgets */}
      {widgets.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Active Widgets</h4>
          {widgets.map((widget, i) => {
            const info = WIDGET_TYPES.find(w => w.type === widget.type);
            return (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                <div className="flex items-center gap-2">
                  {info?.icon}
                  <span className="text-sm font-medium">{info?.label}</span>
                </div>
                <button
                  onClick={() => removeWidget(i)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Available Widgets */}
      <div className="grid grid-cols-2 gap-3">
        {WIDGET_TYPES.map(widgetType => {
          const isActive = widgets.some(w => w.type === widgetType.type);
          const needsUnlock = widgetCount >= 2 && !hasUnlock('widget_slot', `slot_${widgetCount + 1}`) && !isActive;

          return (
            <button
              key={widgetType.type}
              onClick={() => !isActive && addWidget(widgetType.type)}
              disabled={isActive || widgetCount >= 4}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                isActive
                  ? 'border-green-300 bg-green-50 opacity-60'
                  : widgetCount >= 4
                    ? 'border-gray-200 opacity-40 cursor-not-allowed'
                    : 'border-gray-200 hover:border-[#FF6B35]/40 hover:bg-[#FF6B35]/5'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {widgetType.icon}
                <span className="text-sm font-medium">{widgetType.label}</span>
              </div>
              <p className="text-xs text-gray-500">{widgetType.description}</p>
              {needsUnlock && (
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                  <Lock className="w-3 h-3" /> 150 Alpha
                </p>
              )}
              {isActive && (
                <p className="text-xs text-green-600 mt-1">Active</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
