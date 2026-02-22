'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { ExplorePathSummary } from '@teen-alpha/database';
import { CentralNode } from './CentralNode';
import { PathNode } from './PathNode';
import { StepNode } from './StepNode';
import { ConnectionLines } from './ConnectionLines';
import {
  getPathNodePositions,
  getStepNodePositions,
  getResponsiveRadius,
  type Position,
} from '@/lib/mind-map-utils';

interface MindMapContainerProps {
  interest: string;
  paths: ExplorePathSummary[];
  selectedPathIndex: number | null;
  onSelectPath: (index: number) => void;
  isGenerating?: boolean;
}

export function MindMapContainer({
  interest,
  paths,
  selectedPathIndex,
  onSelectPath,
  isGenerating = false,
}: MindMapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  const [isMobile, setIsMobile] = useState(false);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        const height = Math.min(700, width); // Keep it square-ish, max 700px
        setDimensions({ width, height });
        setIsMobile(width < 640);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate positions
  const pathRadius = getResponsiveRadius(220, isMobile);
  const stepRadius = getResponsiveRadius(110, isMobile);
  const pathPositions = getPathNodePositions(pathRadius);

  // Get step positions for selected path
  const getStepPositions = useCallback((pathIndex: number): Position[] => {
    const parentPosition = pathPositions[pathIndex];
    return getStepNodePositions(parentPosition, pathIndex, 5, 5, stepRadius);
  }, [pathPositions, stepRadius]);

  // Build connection lines
  const buildConnectionLines = useCallback(() => {
    const lines: { from: Position; to: Position; id: string; isSelected?: boolean; isStep?: boolean }[] = [];
    const center: Position = { x: 0, y: 0 };

    // Lines from center to each path
    pathPositions.forEach((pos, i) => {
      lines.push({
        from: center,
        to: pos,
        id: `path-${i}`,
        isSelected: selectedPathIndex === i,
      });
    });

    // Lines from selected path to its steps
    if (selectedPathIndex !== null && paths[selectedPathIndex]) {
      const parentPos = pathPositions[selectedPathIndex];
      const stepPositions = getStepPositions(selectedPathIndex);

      stepPositions.forEach((stepPos, i) => {
        lines.push({
          from: parentPos,
          to: stepPos,
          id: `step-${selectedPathIndex}-${i}`,
          isStep: true,
        });
      });
    }

    return lines;
  }, [pathPositions, selectedPathIndex, paths, getStepPositions]);

  const connectionLines = buildConnectionLines();

  if (paths.length === 0) {
    return (
      <div
        ref={containerRef}
        className="relative w-full bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl overflow-hidden"
        style={{ height: dimensions.height }}
      >
        {/* Generating state */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isGenerating ? (
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <CentralNode interest={interest} isAnimating />
              <motion.p
                className="text-gray-600 font-medium"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Discovering your paths...
              </motion.p>
            </motion.div>
          ) : (
            <p className="text-gray-500">Enter your interest to generate paths</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl overflow-hidden"
      style={{ height: dimensions.height }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.15) 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Connection lines (SVG layer) */}
      <ConnectionLines
        lines={connectionLines}
        containerWidth={dimensions.width}
        containerHeight={dimensions.height}
      />

      {/* Central node (user's interest) */}
      <CentralNode interest={interest} />

      {/* Path nodes (arranged radially) */}
      {paths.map((path, index) => (
        <PathNode
          key={path.id || index}
          path={path}
          position={pathPositions[index]}
          index={index}
          isSelected={selectedPathIndex === index}
          onSelect={() => onSelectPath(index)}
          delay={0.1 + index * 0.15}
        />
      ))}

      {/* Step nodes (shown when path is selected and details loaded) */}
      {selectedPathIndex !== null && paths[selectedPathIndex]?.steps && paths[selectedPathIndex].steps.length > 0 && (
        <>
          {getStepPositions(selectedPathIndex).map((pos, i) => {
            const steps = paths[selectedPathIndex].steps;
            const step = steps?.[i];
            return step ? (
              <StepNode
                key={`step-${selectedPathIndex}-${i}`}
                step={step}
                position={pos}
                delay={0.1 + i * 0.08}
                isVisible={true}
              />
            ) : null;
          })}
        </>
      )}

      {/* Touch hint for mobile */}
      {isMobile && selectedPathIndex === null && (
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-white/80 px-3 py-1.5 rounded-full shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          Tap a path to explore
        </motion.div>
      )}
    </div>
  );
}
