'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SeededNode } from '@/lib/pathway/seed';

interface PathwayGraphProps {
  nodes: SeededNode[];
  interest?: string | null;
}

function InterestCenterNode({ data }: NodeProps) {
  const d = data as { label: string };
  return (
    <div className="rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white px-6 py-5 shadow-lg border-4 border-white text-center min-w-[180px] max-w-[220px]">
      <Handle type="source" position={Position.Top} style={{ opacity: 0 }} />
      <div className="text-[10px] uppercase tracking-wider opacity-80 mb-1">Your interest</div>
      <div className="font-bold leading-tight">{d.label}</div>
    </div>
  );
}

const PATH_COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#ef4444'];
const colorForIdx = (i: number) => PATH_COLORS[i % PATH_COLORS.length];

interface NodeData extends Record<string, unknown> {
  label: string;
  icon: string | null;
  kind: SeededNode['kind'];
  status: SeededNode['status'];
  color: string;
  companyId: string | null;
  onSelect: () => void;
}

function PathwayNodeView({ data }: NodeProps) {
  const d = data as NodeData;
  const locked = d.status === 'locked';
  const completed = d.status === 'completed';
  const active = d.status === 'active';
  const available = d.status === 'available';

  const base =
    'rounded-xl border-2 px-4 py-3 shadow-sm text-sm font-medium min-w-[160px] max-w-[200px] text-center transition';
  const stateCls = locked
    ? 'bg-gray-50 border-gray-200 text-gray-400'
    : completed
    ? 'bg-green-50 border-green-500 text-green-900'
    : active
    ? 'bg-white text-gray-900'
    : 'bg-white text-gray-900 hover:shadow-md cursor-pointer';

  const style = !locked ? { borderColor: d.color } : undefined;

  return (
    <div
      className={`${base} ${stateCls}`}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        if (!locked) d.onSelect();
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      {d.icon && <div className="text-lg mb-1">{d.icon}</div>}
      <div className="leading-tight">{d.label}</div>
      {d.kind !== 'root' && (
        <div className="text-[10px] uppercase tracking-wide mt-1 opacity-60">
          {d.kind}
        </div>
      )}
      {locked && <div className="text-[10px] mt-1 opacity-60">🔒 locked</div>}
      {completed && <div className="text-[10px] mt-1 text-green-700">✓ completed</div>}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes = { pathway: PathwayNodeView, interest: InterestCenterNode };

export function PathwayGraph({ nodes, interest }: PathwayGraphProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<SeededNode | null>(null);
  const [completing, setCompleting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { flowNodes, flowEdges } = useMemo(() => {
    const roots = nodes
      .filter((n) => n.kind === 'root')
      .sort((a, b) => a.order_index - b.order_index);

    const pathColorById: Record<string, string> = {};
    roots.forEach((r, i) => {
      if (r.source_path_id) pathColorById[r.source_path_id] = colorForIdx(i);
    });

    const fNodes: Node[] = [];
    const fEdges: Edge[] = [];

    if (interest) {
      fNodes.push({
        id: '__interest_center__',
        type: 'interest',
        position: { x: -110, y: -50 },
        data: { label: interest },
        draggable: false,
        selectable: false,
      });
    }

    // Radial layout like /explore: 5 roots evenly around a central point,
    // each root's children fan out in an arc at greater radius, each depth
    // adds another ring.
    const ROOT_RADIUS = 280;
    const RING_STEP = 260;
    const ARC_SPREAD = (2 * Math.PI) / Math.max(roots.length, 1); // angular slice per path
    const polar = (r: number, a: number) => ({
      x: r * Math.cos(a),
      y: r * Math.sin(a),
    });

    const byPath: Record<string, SeededNode[]> = {};
    for (const n of nodes) {
      const k = n.source_path_id ?? '__no_path__';
      (byPath[k] ||= []).push(n);
    }

    roots.forEach((root, pathIdx) => {
      const color = colorForIdx(pathIdx);
      // Angle for this path (start at top, -π/2, and go clockwise)
      const pathAngle = -Math.PI / 2 + pathIdx * ARC_SPREAD;
      const pathNodes = byPath[root.source_path_id ?? '__no_path__'] ?? [];

      const byDepth: Record<number, SeededNode[]> = {};
      for (const n of pathNodes) (byDepth[n.depth] ||= []).push(n);

      Object.entries(byDepth).forEach(([depthStr, depthNodes]) => {
        const depth = Number(depthStr);
        depthNodes.sort((a, b) => a.order_index - b.order_index);
        const radius = ROOT_RADIUS + depth * RING_STEP;
        const count = depthNodes.length;

        depthNodes.forEach((n, idx) => {
          // Roots sit at the path's exact angle. Children fan out within
          // the path's angular slice, centered on that angle.
          const offset =
            depth === 0
              ? 0
              : count === 1
              ? 0
              : ((idx - (count - 1) / 2) / (count - 1)) * (ARC_SPREAD * 0.75);
          const angle = pathAngle + offset;
          const { x, y } = polar(radius, angle);
          fNodes.push({
            id: n.id,
            type: 'pathway',
            position: { x, y },
            data: {
              label: n.title,
              icon: n.icon,
              kind: n.kind,
              status: n.status,
              color,
              companyId: n.company_id,
              onSelect: () => setSelected(n),
            } satisfies NodeData,
          });
          if (n.parent_node_id) {
            fEdges.push({
              id: `${n.parent_node_id}-${n.id}`,
              source: n.parent_node_id,
              target: n.id,
              style: {
                stroke: n.status === 'locked' ? '#d1d5db' : color,
                strokeWidth: 2,
                strokeDasharray: n.status === 'locked' ? '4 4' : undefined,
              },
            });
          } else if (interest && n.kind === 'root') {
            fEdges.push({
              id: `__interest__-${n.id}`,
              source: '__interest_center__',
              target: n.id,
              style: { stroke: color, strokeWidth: 2, opacity: 0.5 },
            });
          }
        });
      });
    });

    return { flowNodes: fNodes, flowEdges: fEdges };
  }, [nodes, interest]);

  const markComplete = async () => {
    if (!selected) return;
    setCompleting(true);
    setError(null);
    try {
      const res = await fetch('/api/pathway/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ node_id: selected.id }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'failed');
      }
      setSelected(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setCompleting(false);
    }
  };

  const startProject = async () => {
    if (!selected) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch('/api/pathway/start-project', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ node_id: selected.id }),
      });
      const j = await res.json();
      if (!res.ok || !j.project_id) throw new Error(j.error ?? 'failed');
      router.push(`/projects/${j.project_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setStarting(false);
    }
  };

  const isProjectStartable =
    !!selected &&
    selected.kind === 'project' &&
    selected.status === 'available' &&
    !selected.project_id;

  const canComplete =
    !!selected &&
    (selected.status === 'available' || selected.status === 'active') &&
    selected.kind !== 'root' &&
    !isProjectStartable;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
      <div style={{ height: 620 }}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      <aside className="border-l border-gray-100 p-5 max-h-[620px] overflow-y-auto">
        {selected ? (
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">{selected.title}</h3>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-sm"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge variant="secondary">{selected.kind}</Badge>
              <Badge variant="outline">{selected.status}</Badge>
              {selected.source_path_name && (
                <Badge variant="outline">{selected.source_path_name}</Badge>
              )}
            </div>
            {selected.description && (
              <p className="text-sm text-gray-700 mb-4">{selected.description}</p>
            )}

            {selected.kind === 'opportunity' && (
              <>
                <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-3 text-sm text-orange-900">
                  You unlocked a real startup. Talk to your mentor before reaching out — they&apos;ll help craft the message.
                </div>
                {selected.company_id && (
                  <Button
                    variant="outline"
                    className="w-full mb-2"
                    onClick={() => router.push(`/map?company=${selected.company_id}`)}
                  >
                    View on the map →
                  </Button>
                )}
              </>
            )}

            {isProjectStartable && (
              <Button
                onClick={startProject}
                disabled={starting}
                className="w-full"
              >
                {starting ? 'Starting project…' : 'Start this project →'}
              </Button>
            )}

            {selected.kind === 'project' && selected.status === 'active' && selected.project_id && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/projects/${selected.project_id}`)}
              >
                Open project →
              </Button>
            )}

            {canComplete && (
              <Button
                onClick={markComplete}
                disabled={completing}
                className="w-full"
              >
                {completing ? 'Growing your pathway…' : 'Mark complete → grow 5 new branches'}
              </Button>
            )}

            {!canComplete && selected.kind === 'root' && (
              <p className="text-xs text-gray-500">
                Pick one of the branches below to start.
              </p>
            )}

            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500 text-sm">
            Click any unlocked node to see details and grow your pathway.
          </div>
        )}
      </aside>
    </div>
  );
}
