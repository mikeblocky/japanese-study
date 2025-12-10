import React, { useState, useEffect, useRef } from 'react';
import { useSpringValues, useGestureSpring, SpringPresets } from '../../hooks/useSpringAnimation';

/**
 * AnimatedCard - A card component with physics-based hover and click animations.
 * Features liquid glass styling with spring-based scale and shadow effects.
 */
export function AnimatedCard({
    children,
    className = '',
    onClick,
    variant = 'default', // 'default' | 'interactive' | 'subtle'
    delay = 0,
    ...props
}) {
    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const cardRef = useRef(null);

    // Initial mount animation
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    // Spring configuration based on variant
    const config = variant === 'interactive'
        ? SpringPresets.snappy
        : variant === 'subtle'
            ? SpringPresets.gentle
            : SpringPresets.smooth;

    // Calculate target values based on state
    const targetScale = isPressed ? 0.97 : isHovered ? 1.02 : 1;
    const targetY = isVisible ? 0 : 20;
    const targetOpacity = isVisible ? 1 : 0;

    const { values } = useSpringValues(
        { scale: targetScale, y: targetY, opacity: targetOpacity },
        config
    );

    const style = {
        transform: `scale(${values.scale}) translateY(${values.y}px)`,
        opacity: values.opacity,
        willChange: 'transform, opacity',
        cursor: onClick ? 'pointer' : 'default',
    };

    return (
        <div
            ref={cardRef}
            className={`glass-panel rounded-xl p-6 transition-shadow duration-300 ${isHovered ? 'shadow-glow' : ''
                } ${className}`}
            style={style}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * AnimatedList - Renders a list with staggered entrance animations.
 */
export function AnimatedList({
    items,
    renderItem,
    keyExtractor,
    staggerDelay = 50,
    className = '',
}) {
    const [visibleItems, setVisibleItems] = useState([]);

    useEffect(() => {
        const timers = items.map((_, index) =>
            setTimeout(() => {
                setVisibleItems(prev => [...prev, index]);
            }, index * staggerDelay)
        );

        return () => timers.forEach(t => clearTimeout(t));
    }, [items.length, staggerDelay]);

    return (
        <div className={className}>
            {items.map((item, index) => (
                <AnimatedListItem
                    key={keyExtractor(item, index)}
                    isVisible={visibleItems.includes(index)}
                >
                    {renderItem(item, index)}
                </AnimatedListItem>
            ))}
        </div>
    );
}

function AnimatedListItem({ children, isVisible }) {
    const { values } = useSpringValues(
        {
            opacity: isVisible ? 1 : 0,
            y: isVisible ? 0 : 30,
            scale: isVisible ? 1 : 0.95,
        },
        SpringPresets.smooth
    );

    return (
        <div
            style={{
                transform: `translateY(${values.y}px) scale(${values.scale})`,
                opacity: values.opacity,
                willChange: 'transform, opacity',
            }}
        >
            {children}
        </div>
    );
}

/**
 * AnimatedButton - Button with spring-based press animation.
 */
export function AnimatedButton({
    children,
    onClick,
    className = '',
    variant = 'primary', // 'primary' | 'secondary' | 'ghost'
    size = 'md', // 'sm' | 'md' | 'lg'
    disabled = false,
    ...props
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const targetScale = disabled ? 1 : isPressed ? 0.95 : isHovered ? 1.02 : 1;

    const { values } = useSpringValues(
        { scale: targetScale },
        SpringPresets.snappy
    );

    const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
  `;

    const variantClasses = {
        primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:from-indigo-600 hover:to-purple-700 focus:ring-purple-500',
        secondary: 'glass-panel text-gray-100 hover:bg-white/10 focus:ring-white/30',
        ghost: 'text-gray-300 hover:text-white hover:bg-white/5 focus:ring-white/20',
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-7 py-3.5 text-lg',
    };

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            style={{
                transform: `scale(${values.scale})`,
                willChange: 'transform',
            }}
            onClick={onClick}
            onMouseEnter={() => !disabled && setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
            onMouseDown={() => !disabled && setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}

/**
 * AnimatedCounter - Animates number changes with spring physics.
 */
export function AnimatedCounter({
    value,
    className = '',
    format = (n) => n.toLocaleString(),
}) {
    const { values } = useSpringValues(
        { number: value },
        { ...SpringPresets.smooth, precision: 0.5 }
    );

    return (
        <span className={className}>
            {format(Math.round(values.number))}
        </span>
    );
}

/**
 * AnimatedProgress - Progress bar with spring-animated fill.
 */
export function AnimatedProgress({
    value,
    max = 100,
    className = '',
    showLabel = false,
    color = 'purple',
}) {
    const percentage = Math.min((value / max) * 100, 100);

    const { values } = useSpringValues(
        { width: percentage },
        SpringPresets.smooth
    );

    const colorClasses = {
        purple: 'from-purple-500 to-indigo-500',
        green: 'from-green-500 to-emerald-500',
        blue: 'from-blue-500 to-cyan-500',
        orange: 'from-orange-500 to-amber-500',
        pink: 'from-pink-500 to-rose-500',
    };

    return (
        <div className={`relative ${className}`}>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                    className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full shadow-lg`}
                    style={{
                        width: `${values.width}%`,
                        willChange: 'width',
                        transition: 'none',
                    }}
                />
            </div>
            {showLabel && (
                <span className="absolute right-0 -top-6 text-sm text-gray-400">
                    <AnimatedCounter value={percentage} format={(n) => `${Math.round(n)}%`} />
                </span>
            )}
        </div>
    );
}

/**
 * PageTransition - Wrapper for page-level entrance animations.
 */
export function PageTransition({ children, className = '' }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Small delay for entering animation
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const { values } = useSpringValues(
        {
            opacity: isVisible ? 1 : 0,
            y: isVisible ? 0 : 40,
            scale: isVisible ? 1 : 0.98,
        },
        SpringPresets.gentle
    );

    return (
        <div
            className={className}
            style={{
                transform: `translateY(${values.y}px) scale(${values.scale})`,
                opacity: values.opacity,
                willChange: 'transform, opacity',
            }}
        >
            {children}
        </div>
    );
}

export default {
    AnimatedCard,
    AnimatedList,
    AnimatedButton,
    AnimatedCounter,
    AnimatedProgress,
    PageTransition,
};
