'use client';

import { useState } from 'react';
import { MobileButton, MobileCard } from '@/components/mobile';
import { type Pathway } from '@/hooks/usePathways';
import { ChevronDown, ChevronUp, ExternalLink, Check, Loader2 } from 'lucide-react';

interface PathwayCardMobileProps {
  pathway: Pathway;
  index: number;
  onChoose: () => void;
  isChoosing: boolean;
  disabled: boolean;
}

const colorSchemes = [
  {
    bg: 'bg-gradient-to-br from-purple-50 to-indigo-50',
    border: 'border-purple-200',
    accent: 'text-purple-700',
    accentBg: 'bg-purple-100',
  },
  {
    bg: 'bg-gradient-to-br from-cyan-50 to-blue-50',
    border: 'border-cyan-200',
    accent: 'text-cyan-700',
    accentBg: 'bg-cyan-100',
  },
  {
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    border: 'border-emerald-200',
    accent: 'text-emerald-700',
    accentBg: 'bg-emerald-100',
  },
];

export function PathwayCardMobile({
  pathway,
  index,
  onChoose,
  isChoosing,
  disabled,
}: PathwayCardMobileProps) {
  const [expanded, setExpanded] = useState(index === 0);
  const colors = colorSchemes[index % colorSchemes.length];

  return (
    <div className={`rounded-2xl border-2 ${colors.border} ${colors.bg} overflow-hidden`}>
      {/* Header - Always Visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{pathway.icon || '🚀'}</span>
          <h3 className="font-bold text-lg text-gray-900 text-left">
            {pathway.name}
          </h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Connection */}
          <div className={`p-3 rounded-xl ${colors.accentBg}`}>
            <p className={`text-xs font-semibold uppercase ${colors.accent} mb-1`}>
              Your Interest → Opportunity
            </p>
            <p className="text-sm text-gray-700">{pathway.connection}</p>
          </div>

          {/* Startups */}
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 mb-2">
              Top Startups
            </p>
            <div className="space-y-2">
              {pathway.startups.slice(0, 3).map((startup, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between bg-white p-3 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {startup.name}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {startup.description}
                    </p>
                  </div>
                  {startup.website && (
                    <a
                      href={startup.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 p-2 text-indigo-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 mb-2">
              Skills to Build
            </p>
            <div className="flex flex-wrap gap-2">
              {pathway.skills.map((skill, i) => (
                <span
                  key={i}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${colors.accentBg} ${colors.accent}`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* First Steps */}
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 mb-2">
              First Steps
            </p>
            <ol className="space-y-2">
              {pathway.firstSteps.map((step, i) => (
                <li key={i} className="flex items-start text-sm">
                  <span className={`font-bold ${colors.accent} mr-2 min-w-[1.25rem]`}>
                    {i + 1}.
                  </span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Choose Button */}
          <div className="pt-3 border-t border-gray-200">
            <MobileButton
              fullWidth
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onChoose();
              }}
              disabled={disabled}
              className={`${colors.accentBg} ${colors.accent} border-2 ${colors.border}`}
            >
              {isChoosing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Project...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Choose This Pathway
                </>
              )}
            </MobileButton>
            <p className="text-xs text-center text-gray-500 mt-2">
              Creates a project with these first steps as tasks
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
