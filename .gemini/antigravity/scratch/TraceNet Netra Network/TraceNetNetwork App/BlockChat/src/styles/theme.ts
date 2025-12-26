/**
 * BlockChat Design System
 * Modern, premium design tokens for the application
 */

export const Colors = {
    // Primary Gradients
    primary: {
        start: '#667eea',
        end: '#764ba2',
        solid: '#6b7de8',
    },
    secondary: {
        start: '#f093fb',
        end: '#f5576c',
        solid: '#f2748e',
    },
    accent: {
        start: '#4facfe',
        end: '#00f2fe',
        solid: '#27a0fe',
    },
    success: {
        start: '#11998e',
        end: '#38ef7d',
        solid: '#24c485',
    },

    // Background Colors
    background: {
        primary: '#f8f9fa',
        secondary: '#ffffff',
        dark: '#1a1a2e',
        gradient: ['#0f0c29', '#302b63', '#24243e'],
    },

    // Surface Colors (Glassmorphism)
    surface: {
        glass: 'rgba(255, 255, 255, 0.1)',
        glassLight: 'rgba(255, 255, 255, 0.15)',
        glassDark: 'rgba(0, 0, 0, 0.1)',
    },

    // Text Colors
    text: {
        primary: '#2d3436',
        secondary: '#636e72',
        tertiary: '#b2bec3',
        inverse: '#ffffff',
        muted: '#95a5a6',
    },

    // Semantic Colors
    error: '#e74c3c',
    warning: '#f39c12',
    info: '#3498db',

    // UI Element Colors
    border: {
        light: '#e1e8ed',
        medium: '#c8d6e5',
        dark: '#8395a7',
    },
};

export const Typography = {
    fontSizes: {
        xs: 10,
        sm: 12,
        base: 14,
        md: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 28,
        '4xl': 32,
        '5xl': 40,
    },
    fontWeights: {
        light: '300' as const,
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
        extrabold: '800' as const,
    },
    lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
        loose: 2,
    },
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
};

export const BorderRadius = {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
};

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    colored: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    }),
};

export const Animations = {
    duration: {
        fast: 150,
        normal: 250,
        slow: 350,
    },
    easing: {
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
    },
};

// Helper function to create linear gradient style
export const createGradient = (colors: string[]) => {
    return {
        colors,
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    };
};

export default {
    Colors,
    Typography,
    Spacing,
    BorderRadius,
    Shadows,
    Animations,
    createGradient,
};
