import { Platform } from 'react-native';

// Polyfill for Reanimated + SVG on Web
// This fixes "TypeError: _this$root.setNativeProps is not a function"
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const setNativeProps = function (this: any, props: any) {
    if (!props) return;
    
    // Handle style prop
    if (props.style) {
      if (this.style) {
        // Reanimated might pass style as an object
        Object.assign(this.style, props.style);
      }
    }
    
    // Handle other props as attributes
    for (const [key, value] of Object.entries(props)) {
      if (key === 'style') continue;
      
      if (this.setAttribute) {
        this.setAttribute(key, String(value));
      }
    }
  };

  // Patch SVGElement prototype
  // @ts-ignore
  if (typeof SVGElement !== 'undefined' && !SVGElement.prototype.setNativeProps) {
    // @ts-ignore
    SVGElement.prototype.setNativeProps = setNativeProps;
  }
  
  // Patch HTMLElement prototype (just in case)
  // @ts-ignore
  if (typeof HTMLElement !== 'undefined' && !HTMLElement.prototype.setNativeProps) {
    // @ts-ignore
    HTMLElement.prototype.setNativeProps = setNativeProps;
  }
}