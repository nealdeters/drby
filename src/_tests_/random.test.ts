import { SeededRandom } from '../utils/random';

describe('SeededRandom', () => {
  it('produces deterministic results', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);
    expect(rng1.next()).toBe(rng2.next());
    expect(rng1.range(0, 10)).toBe(rng2.range(0, 10));
  });

  it('produces different results for different seeds', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(67890);
    expect(rng1.next()).not.toBe(rng2.next());
  });
});