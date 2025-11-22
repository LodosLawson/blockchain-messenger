import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-inter)", "Inter", "sans-serif"],
                display: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
            },
            colors: {
                // Modern Stitch Design System
                'stitch-blue': '#2b6cee',
                'stitch-purple': '#8b5cf6',
                'stitch-pink': '#ec4899',
                'stitch-cyan': '#06b6d4',

                // Backgrounds
                'background-dark': '#0a0e1a',
                'background-darker': '#050810',
                'surface-dark': '#111827',
                'sidebar-bg': '#0f1419',

                // Text
                'muted-dark': '#94a3b8',
                'text-primary': '#f8fafc',
                'text-secondary': '#cbd5e1',

                // Borders
                'border-dark': '#1e293b',
                'border-light': '#334155',

                // Accents
                'accent-blue': '#3b82f6',
                'accent-purple': '#a78bfa',
                'accent-green': '#10b981',
                'accent-red': '#ef4444',
                'accent-yellow': '#f59e0b',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'gradient-mesh': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'gradient-sunset': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                'gradient-ocean': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'gradient-forest': 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
            },
            boxShadow: {
                'glow-blue': '0 0 20px rgba(43, 108, 238, 0.4)',
                'glow-purple': '0 0 20px rgba(139, 92, 246, 0.4)',
                'glow-pink': '0 0 20px rgba(236, 72, 153, 0.4)',
                'inner-glow': 'inset 0 0 20px rgba(255, 255, 255, 0.05)',
                'neumorphic': '12px 12px 24px #0a0e1a, -12px -12px 24px #1a1e2a',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-down': 'slideDown 0.5s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
                'shimmer': 'shimmer 2s linear infinite',
                'float': 'float 3s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                glow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(43, 108, 238, 0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(43, 108, 238, 0.6)' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
};
export default config;
