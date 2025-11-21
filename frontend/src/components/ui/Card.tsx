import React from 'react';

interface CardProps {
    variant?: 'glass' | 'solid' | 'gradient' | 'bordered';
    hover?: boolean;
    glow?: boolean;
    className?: string;
    children: React.ReactNode;
}

export default function Card({
    variant = 'glass',
    hover = true,
    glow = false,
    className = '',
    children
}: CardProps) {
    const baseStyles = 'rounded-2xl p-6 transition-all duration-300';

    const variantStyles = {
        glass: 'glass-premium',
        solid: 'bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700',
        gradient: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl',
        bordered: 'bg-transparent border-2 border-indigo-500 dark:border-indigo-400'
    };

    const hoverStyles = hover ? 'hover-lift cursor-pointer' : '';
    const glowStyles = glow ? 'hover-glow' : '';

    return (
        <div className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${glowStyles} ${className}`}>
            {children}
        </div>
    );
}
