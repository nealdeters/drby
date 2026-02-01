import '../polyfills';

describe('polyfills', () => {
  it('defines setNativeProps on SVGElement prototype in web environment', () => {
    // This test assumes a JSDOM-like environment where SVGElement exists
    if (typeof window !== 'undefined' && typeof SVGElement !== 'undefined') {
        const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        // @ts-ignore
        expect(typeof svgElement.setNativeProps).toBe('function');
    }
  });
});