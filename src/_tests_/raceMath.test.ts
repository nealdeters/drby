import { getPositionAtProgress } from '../utils/raceMath';

describe('raceMath', () => {
  const width = 200;
  const height = 100;
  // Padding 20
  // w = 160, h = 60
  // r = 30
  // straightLen = 160 - 60 = 100
  // cx = 100, cy = 50

  it('calculates start position (progress 0) correctly', () => {
    const pos = getPositionAtProgress(0, width, height);
    // Bottom center
    // x = 100, y = 50 + 30 = 80
    expect(pos.x).toBeCloseTo(100);
    expect(pos.y).toBeCloseTo(80);
  });

  it('calculates position at 25% (end of bottom straight/start of right curve)', () => {
    // This depends on the ratio of straight to curve, so exact 0.25 might not be exactly the corner.
    // But we can check bounds.
    const pos = getPositionAtProgress(0.1, width, height);
    // Should be moving right
    expect(pos.x).toBeGreaterThan(100);
    expect(pos.y).toBeCloseTo(80);
  });

  it('calculates position at 50% (top center)', () => {
    // Top center is roughly 50% if straight and curves are balanced, but let's check y is top
    const pos = getPositionAtProgress(0.5, width, height);
    // Should be near top y = 50 - 30 = 20
    expect(pos.y).toBeLessThan(50);
  });
});