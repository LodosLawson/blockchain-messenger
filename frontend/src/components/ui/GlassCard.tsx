import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'strong' | 'premium';
    hoverEffect?: boolean;
    glow?: boolean;
    onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    variant = 'default',
    hoverEffect = false,
    glow = false,
    onClick
}) => {
    const getVariantClass = () => {
        switch (variant) {
            case 'strong':
                return 'glass-strong';
            case 'premium':
                return 'glass-premium';
            default:
                return 'glass';
        }
    };

    const baseClasses = `rounded-2xl p-6 transition-all duration-300 ${getVariantClass()}`;
    const hoverClasses = hoverEffect ? 'hover:transform hover:-translate-y-1 hover:shadow-xl' : '';
    const glowClasses = glow ? 'hover:shadow-glow-blue border-stitch-blue/30' : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${baseClasses} ${hoverClasses} ${glowClasses} ${className}`}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
};

export default GlassCard;
