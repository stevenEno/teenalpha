// Mind map positioning utilities using polar coordinates

export interface Position {
  x: number;
  y: number;
}

/**
 * Calculate the position of a node in polar coordinates.
 * Nodes are arranged radially around the center.
 */
export function getRadialPosition(
  index: number,
  totalNodes: number,
  radius: number,
  startAngle: number = -90 // Start from top (-90°)
): Position {
  const angleStep = 360 / totalNodes;
  const angle = startAngle + index * angleStep;
  const radians = (angle * Math.PI) / 180;

  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
  };
}

/**
 * Calculate positions for 5 path nodes arranged radially.
 * Nodes are at 72° intervals starting from the top.
 */
export function getPathNodePositions(radius: number = 220): Position[] {
  return Array.from({ length: 5 }, (_, i) => getRadialPosition(i, 5, radius, -90));
}

/**
 * Calculate positions for step nodes fanning out from a parent path node.
 * Steps form a smaller arc around the parent node.
 */
export function getStepNodePositions(
  parentPosition: Position,
  parentIndex: number,
  totalParents: number = 5,
  stepCount: number = 5,
  stepRadius: number = 100
): Position[] {
  // Calculate the angle of the parent from center
  const parentAngle = -90 + parentIndex * (360 / totalParents);

  // Steps fan out in an arc centered around the parent's outward direction
  const arcSpread = 80; // Total degrees to spread across
  const startAngle = parentAngle - arcSpread / 2;
  const angleStep = arcSpread / (stepCount - 1);

  return Array.from({ length: stepCount }, (_, i) => {
    const angle = startAngle + i * angleStep;
    const radians = (angle * Math.PI) / 180;

    return {
      x: parentPosition.x + Math.cos(radians) * stepRadius,
      y: parentPosition.y + Math.sin(radians) * stepRadius,
    };
  });
}

/**
 * Generate SVG path data for a curved connection line.
 */
export function getCurvedPath(from: Position, to: Position): string {
  // Calculate control point for a smooth curve
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  // Offset the control point perpendicular to the line
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Curve amount based on distance (shorter = less curve)
  const curveAmount = length * 0.15;

  // Perpendicular offset
  const perpX = (-dy / length) * curveAmount;
  const perpY = (dx / length) * curveAmount;

  const controlX = midX + perpX;
  const controlY = midY + perpY;

  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
}

/**
 * Generate SVG path data for a straight connection line.
 */
export function getStraightPath(from: Position, to: Position): string {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
}

/**
 * Calculate the angle between two points (for arrow directions, etc.).
 */
export function getAngleBetweenPoints(from: Position, to: Position): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Scale radius for mobile devices.
 */
export function getResponsiveRadius(baseRadius: number, isMobile: boolean): number {
  return isMobile ? baseRadius * 0.65 : baseRadius;
}

/**
 * Animation variants for staggered entrance.
 */
export const nodeAnimationVariants = {
  hidden: {
    opacity: 0,
    scale: 0.5,
  },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
      delay,
    },
  }),
  selected: {
    scale: 1.1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  },
};

/**
 * Animation variants for connection lines.
 */
export const lineAnimationVariants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: (delay: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.5, delay },
      opacity: { duration: 0.2, delay },
    },
  }),
};
