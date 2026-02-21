/**
 * Centralized Theme System for DRBY Racing League
 * 
 * To change themes, simply modify the CSS variables in :root in index.css
 * or swap the color values in this file.
 */

export const theme = {
  // Primary Brand Colors
  primary: {
    50: '#f0f7f2',
    100: '#d9efdf',
    200: '#b3dfb8',
    300: '#8cc98f',
    400: '#66b066',
    500: '#4A895C',
    600: '#3A6A4A',
    700: '#2A4B38',
    800: '#1A2C26',
    900: '#0A0D14',
  },
  
  // Semantic Colors
  semantic: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    gold: '#fbbf24',
  },
  
  // Surface Colors (Backgrounds)
  surface: {
    page: '#4A895C',        // Main page background
    card: '#3A6A4A',        // Card/item background
    cardLight: '#f0f7f2',   // Light card background
    elevated: '#4A895C',    // Elevated surfaces (buttons, badges)
    dark: '#2A4B38',        // Dark surfaces
    darkest: '#1A2C26',     // Darkest surfaces
  },
  
  // Text Colors
  text: {
    primary: '#f0f7f2',     // Main text on dark backgrounds
    secondary: '#d9efdf',   // Secondary text
    muted: '#b3dfb8',       // Muted text
    tertiary: '#8cc98f',    // Tertiary text
    onLight: '#1A2C26',     // Text on light backgrounds
    onLightSecondary: '#3A6A4A', // Secondary text on light backgrounds
  },
  
  // Border/Divider Colors
  border: {
    default: '#66b066',
    subtle: '#4A895C',
  },
} as const;

// Layout constants
export const layout = {
  maxWidth: '100%',
  cardPadding: 20,
  cardMargin: 16,
  cardBorderRadius: 24,
  sectionBorderRadius: 16,
} as const;

// CSS Custom Properties for runtime theme switching
export const cssVariables = `
  :root {
    /* Primary Brand Colors */
    --drby-primary-50: #f0f7f2;
    --drby-primary-100: #d9efdf;
    --drby-primary-200: #b3dfb8;
    --drby-primary-300: #8cc98f;
    --drby-primary-400: #66b066;
    --drby-primary-500: #4A895C;
    --drby-primary-600: #3A6A4A;
    --drby-primary-700: #2A4B38;
    --drby-primary-800: #1A2C26;
    --drby-primary-900: #0A0D14;
    
    /* Semantic Colors */
    --drby-success: #22c55e;
    --drby-warning: #f59e0b;
    --drby-error: #ef4444;
    --drby-gold: #fbbf24;
    
    /* Surfaces */
    --drby-surface-page: var(--drby-primary-500);
    --drby-surface-card: var(--drby-primary-600);
    --drby-surface-card-light: var(--drby-primary-50);
    --drby-surface-elevated: var(--drby-primary-500);
    --drby-surface-dark: var(--drby-primary-700);
    --drby-surface-darkest: var(--drby-primary-800);
    
    /* Text */
    --drby-text-primary: var(--drby-primary-50);
    --drby-text-secondary: var(--drby-primary-100);
    --drby-text-muted: var(--drby-primary-200);
    --drby-text-tertiary: var(--drby-primary-300);
    --drby-text-on-light: var(--drby-primary-800);
    --drby-text-on-light-secondary: var(--drby-primary-600);
    
    /* Borders */
    --drby-border-default: var(--drby-primary-400);
    --drby-border-subtle: var(--drby-primary-500);
  }
`;

// Helper to get health bar color based on health percentage
export const getHealthColor = (health: number): string => {
  if (health > 70) return theme.semantic.success;
  if (health > 30) return theme.semantic.warning;
  return theme.semantic.error;
};

// Common style objects for reuse
export const commonStyles = {
  card: {
    backgroundColor: theme.surface.card,
    padding: layout.cardPadding,
    marginBottom: 16,
    marginHorizontal: layout.cardMargin,
    borderRadius: layout.cardBorderRadius,
  },
  cardLight: {
    backgroundColor: theme.surface.cardLight,
    padding: layout.cardPadding,
    marginBottom: 16,
    borderRadius: layout.cardBorderRadius,
  },
  section: {
    backgroundColor: theme.surface.elevated,
    padding: 20,
    borderRadius: layout.sectionBorderRadius,
  },
  textPrimary: {
    color: theme.text.primary,
  },
  textSecondary: {
    color: theme.text.secondary,
  },
  textMuted: {
    color: theme.text.muted,
  },
} as const;

export default theme;
