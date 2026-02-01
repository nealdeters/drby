export interface Point {
  x: number;
  y: number;
}

/**
 * Calculates the SVG Path data for a stadium (capsule) shape.
 * Assumes the track fits within the given width/height with some padding.
 */
export const getTrackPath = (width: number, height: number, padding: number = 20): string => {
  const w = width - padding * 2;
  const h = height - padding * 2;
  const r = h / 2; // Radius of the semicircles
  const straightLen = w - 2 * r; // Length of straight sections

  // Starting at bottom-center, going counter-clockwise
  // M startX startY
  // L (line to bottom-right start of curve)
  // A (arc to top-right)
  // L (line to top-left start of curve)
  // A (arc to bottom-left)
  // Z (close)
  
  const cx = width / 2;
  const cy = height / 2;
  
  // We construct the path starting from bottom center
  const startX = cx;
  const startY = cy + r;

  return `
    M ${startX} ${startY}
    L ${cx + straightLen / 2} ${startY}
    A ${r} ${r} 0 0 0 ${cx + straightLen / 2} ${cy - r}
    L ${cx - straightLen / 2} ${cy - r}
    A ${r} ${r} 0 0 0 ${cx - straightLen / 2} ${startY}
    Z
  `;
};

/**
 * Calculates the (x, y) coordinate on the track for a given progress (0-1).
 * Progress 0 is at the bottom center, moving counter-clockwise.
 */
export const getPositionAtProgress = (
  progress: number,
  width: number,
  height: number,
  padding: number = 20
): Point => {
  // Normalize progress to 0-1
  const p = progress % 1;
  
  const w = width - padding * 2;
  const h = height - padding * 2;
  const r = h / 2;
  const straightLen = w - 2 * r;
  
  // Perimeter segments
  const straight = straightLen;
  const curve = Math.PI * r;
  const perimeter = 2 * straight + 2 * curve;
  
  const currentDist = p * perimeter;
  
  const cx = width / 2;
  const cy = height / 2;

  // 1. Bottom Straight (Center to Right)
  if (currentDist < straight / 2) {
    return { x: cx + currentDist, y: cy + r };
  }
  
  // 2. Right Curve
  if (currentDist < straight / 2 + curve) {
    const curveDist = currentDist - (straight / 2);
    const angle = -Math.PI / 2 + (curveDist / curve) * Math.PI; // -90 to +90
    // Adjust angle for SVG coordinate system (y is down)
    // Actually, standard parametric circle: x = cx + r*cos(t), y = cy + r*sin(t)
    // We want to go from Bottom (PI/2) to Top (-PI/2) via Right (0)
    const t = Math.PI / 2 - (curveDist / curve) * Math.PI;
    return { x: cx + straightLen / 2 + r * Math.cos(t), y: cy + r * Math.sin(t) };
  }

  // 3. Top Straight (Right to Left)
  if (currentDist < straight / 2 + curve + straight) {
    const straightDist = currentDist - (straight / 2 + curve);
    return { x: (cx + straightLen / 2) - straightDist, y: cy - r };
  }

  // 4. Left Curve (Top to Bottom)
  const curveDist = currentDist - (straight / 2 + curve + straight);
  const t = -Math.PI / 2 - (curveDist / curve) * Math.PI;
  return { x: cx - straightLen / 2 + r * Math.cos(t), y: cy + r * Math.sin(t) };
};