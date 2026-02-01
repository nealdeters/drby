// react-native-shims.js
export const parse = (val) => val;
export const props2transform = (props) => props;
export const codegenNativeComponent = (name) => name;
export const ReactFabric = {};

// Satisfy both named and default imports
export default {
  parse,
  props2transform,
  codegenNativeComponent,
  ReactFabric,
};