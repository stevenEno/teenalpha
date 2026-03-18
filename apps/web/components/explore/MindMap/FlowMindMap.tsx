'use client';

import { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  useReactFlow,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ExplorePathSummary } from '@teen-alpha/database';
import { getPathNodePositions, getStepNodePositions } from '@/lib/mind-map-utils';
import { CentralFlowNode } from './nodes/CentralFlowNode';
import { PathFlowNode } from './nodes/PathFlowNode';
import { StepFlowNode } from './nodes/StepFlowNode';
import { GradientEdge } from './edges/GradientEdge';

const nodeTypes = {
  central: CentralFlowNode,
  path: PathFlowNode,
  step: StepFlowNode,
};

const edgeTypes = {
  gradient: GradientEdge,
};

const miniMapNodeColor = (node: Node) => {
  if (node.type === 'central') return '#7c3aed';
  if (node.type === 'step') return '#e5e7eb';
  // Path node colors
  const colors = ['#34d399', '#fbbf24', '#f472b6', '#22d3ee', '#a78bfa'];
  const index = (node.data as { index?: number })?.index ?? 0;
  return colors[index % colors.length];
};

interface FlowMindMapProps {
  interest: string;
  paths: ExplorePathSummary[];
  selectedPathIndex: number | null;
  onSelectPath: (index: number) => void;
}

export function FlowMindMap({
  interest,
  paths,
  selectedPathIndex,
  onSelectPath,
}: FlowMindMapProps) {
  const { fitView } = useReactFlow();

  // Handle node clicks at the flow level — more reliable than onClick inside custom nodes
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'path') {
      const index = (node.data as { index: number }).index;
      onSelectPath(index);
    }
  }, [onSelectPath]);

  // Larger radius since React Flow handles pan/zoom — no clipping
  const pathRadius = 350;
  const stepRadius = 180;
  const pathPositions = useMemo(() => getPathNodePositions(pathRadius), [pathRadius]);

  // Build nodes
  const nodes = useMemo<Node[]>(() => {
    const result: Node[] = [];

    // Central node
    result.push({
      id: 'central',
      type: 'central',
      position: { x: -72, y: -72 }, // offset by half node size (144/2)
      data: { interest, isAnimating: false },
      draggable: false,
      selectable: false,
    });

    // Path nodes
    pathPositions.forEach((pos, i) => {
      if (!paths[i]) return;
      result.push({
        id: `path-${i}`,
        type: 'path',
        position: { x: pos.x - 64, y: pos.y - 64 }, // offset by half node size (128/2)
        data: {
          path: paths[i],
          index: i,
          isSelected: selectedPathIndex === i,
        },
        draggable: false,
        selectable: false,
      });
    });

    // Step nodes for selected path
    if (selectedPathIndex !== null && paths[selectedPathIndex]?.steps?.length) {
      const parentPos = pathPositions[selectedPathIndex];
      const stepPositions = getStepNodePositions(
        parentPos,
        selectedPathIndex,
        5,
        5,
        stepRadius
      );

      paths[selectedPathIndex].steps!.forEach((step, i) => {
        const stepPos = stepPositions[i];
        if (!stepPos) return;
        result.push({
          id: `step-${selectedPathIndex}-${i}`,
          type: 'step',
          position: { x: stepPos.x - 24, y: stepPos.y - 24 }, // offset by half (48/2)
          data: { step, delay: 0.1 + i * 0.08 },
          draggable: false,
          selectable: false,
        });
      });
    }

    return result;
  }, [interest, paths, pathPositions, selectedPathIndex, stepRadius]);

  // Build edges
  const edges = useMemo<Edge[]>(() => {
    const result: Edge[] = [];

    // Edges from central to each path
    pathPositions.forEach((_, i) => {
      if (!paths[i]) return;
      result.push({
        id: `edge-central-path-${i}`,
        source: 'central',
        target: `path-${i}`,
        type: 'gradient',
        data: {
          colorIndex: i,
          isSelected: selectedPathIndex === i,
          isStep: false,
        },
      });
    });

    // Edges from selected path to its steps
    if (selectedPathIndex !== null && paths[selectedPathIndex]?.steps?.length) {
      paths[selectedPathIndex].steps!.forEach((_, i) => {
        result.push({
          id: `edge-path-${selectedPathIndex}-step-${i}`,
          source: `path-${selectedPathIndex}`,
          target: `step-${selectedPathIndex}-${i}`,
          type: 'gradient',
          data: {
            colorIndex: selectedPathIndex,
            isSelected: false,
            isStep: true,
          },
        });
      });
    }

    return result;
  }, [paths, pathPositions, selectedPathIndex]);

  // Fit view when nodes change (path selected/deselected)
  const prevNodeCount = useMemo(() => nodes.length, [nodes]);
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.15, duration: 400 });
    }, 100);
    return () => clearTimeout(timer);
  }, [prevNodeCount, fitView]);

  const onInit = useCallback(() => {
    setTimeout(() => fitView({ padding: 0.15, duration: 0 }), 50);
  }, [fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onInit={onInit}
      onNodeClick={handleNodeClick}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.2}
      maxZoom={2}
      panOnDrag
      zoomOnScroll
      zoomOnPinch
      preventScrolling={false}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      proOptions={{ hideAttribution: true }}
      className="!bg-transparent"
    >
      <MiniMap
        nodeColor={miniMapNodeColor}
        maskColor="rgba(248, 250, 252, 0.8)"
        className="!bottom-2 !right-2 !rounded-xl !border-gray-200"
        pannable
        zoomable
      />
      <Controls
        className="!bottom-2 !left-2 !rounded-xl !border-gray-200 !shadow-md"
        showInteractive={false}
      />
    </ReactFlow>
  );
}
