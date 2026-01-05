'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Task } from '@teen-alpha/database';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onAddEvidence?: (task: Task) => void;
  onViewEvidence?: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onAddEvidence, onViewEvidence }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasEvidence = !!task.evidence_url;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white border rounded-lg p-4 mb-3 cursor-grab active:cursor-grabbing
        hover:border-blue-300 transition-all
        ${isDragging ? 'shadow-lg ring-2 ring-blue-400' : 'shadow-sm'}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 flex-1 pr-2">
          {task.title}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
        >
          ✏️
        </Button>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
        {task.description}
      </p>

      {task.suggested_evidence && !hasEvidence && (
        <div className="bg-gray-50 rounded p-2 mb-3">
          <p className="text-xs font-medium text-gray-700 mb-1">
            💡 Suggested Evidence:
          </p>
          <p className="text-xs text-gray-600 line-clamp-2">
            {task.suggested_evidence}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {hasEvidence ? (
            <Button
              variant="secondary"
              size="sm"
              className="text-xs h-7"
              onClick={(e) => {
                e.stopPropagation();
                onViewEvidence?.(task);
              }}
            >
              📎 View Evidence
            </Button>
          ) : task.status === 'in_progress' || task.status === 'done' ? (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={(e) => {
                e.stopPropagation();
                onAddEvidence?.(task);
              }}
            >
              📸 Add Evidence
            </Button>
          ) : null}

          {task.ai_generated && (
            <Badge variant="outline" className="text-xs">
              ✨ AI
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}