declare module 'react-dom/client' {
  export function createRoot(container: Element | DocumentFragment): { render(element: import('react').ReactNode): void };
}
