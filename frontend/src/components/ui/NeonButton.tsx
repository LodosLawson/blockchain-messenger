import React from 'react';
import { motion } from 'framer-motion';

interface NeonButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    children?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    isLoading?: boolean;
    glow?: boolean;
}

const NeonButton: React.FC<NeonButtonProps> = ({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    icon,
    isLoading = false,
    glow = false,
    ...props
}) => {
    const getVariantClass = () => {
        switch (variant) {
            case 'primary':
                return 'btn-primary';
            case 'secondary':
                return 'btn-secondary';
            case 'ghost':
                return 'btn-ghost';
            case 'danger':
                return 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:shadow-glow-pink';
            default:
                return 'btn-primary';
        }
    };

    const getSizeClass = () => {
        switch (size) {
            case 'sm':
                return 'px-4 py-2 text-sm';
            case 'lg':
                return 'px-8 py-4 text-lg';
            default:
                return 'px-6 py-3';
        }
    };

    const glowClass = glow ? 'shadow-glow-blue' : '';

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
                flex items-center justify-center gap-2 
                rounded-xl font-semibold transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed
                ${getVariantClass()} ${getSizeClass()} ${glowClass} ${className}
            `}
            disabled={isLoading || props.disabled}
            {...(props as any)}
        >
            {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : icon ? (
                <span className="flex items-center gap-2">
                    {icon}
                    {children}
                </span>
            ) : (
                children
            )}
        </motion.button>
    );
};

export default NeonButton;


