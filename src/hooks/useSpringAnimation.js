import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Physics-based spring animation hook.
 * Creates natural, physically realistic animations with configurable tension, friction, and mass.
 * 
 * @param {number} target - Target value to animate towards
 * @param {object} config - Spring configuration { tension, friction, mass, precision }
 * @returns {object} { value, velocity, isAnimating, set, stop }
 */
export function useSpring(target, config = {}) {
    const {
        tension = 170,    // Spring stiffness (higher = snappier)
        friction = 26,    // Damping (higher = less bouncy)
        mass = 1,         // Weight (higher = more momentum)
        precision = 0.01, // Animation stops when under this threshold
    } = config;

    const [value, setValue] = useState(target);
    const [velocity, setVelocity] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const animationRef = useRef(null);
    const targetRef = useRef(target);
    const velocityRef = useRef(0);
    const valueRef = useRef(target);

    const stop = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        setIsAnimating(false);
    }, []);

    const animate = useCallback(() => {
        const step = () => {
            // Spring physics: F = -kx - cv
            // Where k = tension, c = friction, x = displacement, v = velocity
            const displacement = valueRef.current - targetRef.current;
            const springForce = -tension * displacement;
            const dampingForce = -friction * velocityRef.current;
            const acceleration = (springForce + dampingForce) / mass;

            // Integrate
            velocityRef.current += acceleration * (1 / 60); // ~60fps
            valueRef.current += velocityRef.current * (1 / 60);

            setValue(valueRef.current);
            setVelocity(velocityRef.current);

            // Check if animation should stop
            const isSettled =
                Math.abs(velocityRef.current) < precision &&
                Math.abs(displacement) < precision;

            if (isSettled) {
                valueRef.current = targetRef.current;
                velocityRef.current = 0;
                setValue(targetRef.current);
                setVelocity(0);
                setIsAnimating(false);
                animationRef.current = null;
            } else {
                animationRef.current = requestAnimationFrame(step);
            }
        };

        step();
    }, [tension, friction, mass, precision]);

    const set = useCallback((newTarget) => {
        targetRef.current = newTarget;
        if (!animationRef.current) {
            setIsAnimating(true);
            animate();
        }
    }, [animate]);

    useEffect(() => {
        set(target);
        return () => stop();
    }, [target, set, stop]);

    return { value, velocity, isAnimating, set, stop };
}

/**
 * Multi-dimensional spring animation for objects with multiple values.
 * 
 * @param {object} target - Object with values to animate { x, y, scale, opacity, etc. }
 * @param {object} config - Spring configuration
 * @returns {object} { values, isAnimating }
 */
export function useSpringValues(target, config = {}) {
    const {
        tension = 170,
        friction = 26,
        mass = 1,
        precision = 0.01,
    } = config;

    const [values, setValues] = useState(target);
    const [isAnimating, setIsAnimating] = useState(false);

    const animationRef = useRef(null);
    const targetRef = useRef(target);
    const valuesRef = useRef(target);
    const velocitiesRef = useRef(
        Object.fromEntries(Object.keys(target).map(k => [k, 0]))
    );

    useEffect(() => {
        targetRef.current = target;

        if (animationRef.current) return;

        setIsAnimating(true);

        const step = () => {
            let allSettled = true;
            const newValues = {};

            for (const key of Object.keys(targetRef.current)) {
                const displacement = valuesRef.current[key] - targetRef.current[key];
                const springForce = -tension * displacement;
                const dampingForce = -friction * velocitiesRef.current[key];
                const acceleration = (springForce + dampingForce) / mass;

                velocitiesRef.current[key] += acceleration * (1 / 60);
                valuesRef.current[key] += velocitiesRef.current[key] * (1 / 60);

                newValues[key] = valuesRef.current[key];

                const isSettled =
                    Math.abs(velocitiesRef.current[key]) < precision &&
                    Math.abs(displacement) < precision;

                if (!isSettled) allSettled = false;
            }

            setValues({ ...newValues });

            if (allSettled) {
                valuesRef.current = { ...targetRef.current };
                velocitiesRef.current = Object.fromEntries(
                    Object.keys(targetRef.current).map(k => [k, 0])
                );
                setValues({ ...targetRef.current });
                setIsAnimating(false);
                animationRef.current = null;
            } else {
                animationRef.current = requestAnimationFrame(step);
            }
        };

        animationRef.current = requestAnimationFrame(step);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        };
    }, [target, tension, friction, mass, precision]);

    return { values, isAnimating };
}

/**
 * Staggered spring animation for lists of items.
 * Creates a cascading animation effect.
 * 
 * @param {number} itemCount - Number of items to animate
 * @param {boolean} isVisible - Whether items should be visible
 * @param {object} config - Configuration { staggerDelay, ...springConfig }
 * @returns {array} Array of animation states for each item
 */
export function useStaggeredSpring(itemCount, isVisible, config = {}) {
    const {
        staggerDelay = 50, // ms between each item
        ...springConfig
    } = config;

    const [itemStates, setItemStates] = useState(
        Array(itemCount).fill({ opacity: 0, y: 20 })
    );

    useEffect(() => {
        const timers = [];

        for (let i = 0; i < itemCount; i++) {
            const timer = setTimeout(() => {
                setItemStates(prev => {
                    const newStates = [...prev];
                    newStates[i] = isVisible
                        ? { opacity: 1, y: 0 }
                        : { opacity: 0, y: 20 };
                    return newStates;
                });
            }, i * staggerDelay);

            timers.push(timer);
        }

        return () => timers.forEach(t => clearTimeout(t));
    }, [itemCount, isVisible, staggerDelay]);

    return itemStates;
}

/**
 * Hook for gesture-based spring animations (drag, hover, etc.)
 * 
 * @param {object} config - Spring configuration
 * @returns {object} { style, bind } where bind returns event handlers
 */
export function useGestureSpring(config = {}) {
    const {
        tension = 300,
        friction = 30,
        hoverScale = 1.02,
        tapScale = 0.98,
    } = config;

    const [state, setState] = useState({
        scale: 1,
        x: 0,
        y: 0,
        isHovered: false,
        isPressed: false,
    });

    const { values } = useSpringValues(
        {
            scale: state.isPressed ? tapScale : state.isHovered ? hoverScale : 1,
            x: state.x,
            y: state.y,
        },
        { tension, friction }
    );

    const bind = useCallback(() => ({
        onMouseEnter: () => setState(s => ({ ...s, isHovered: true })),
        onMouseLeave: () => setState(s => ({ ...s, isHovered: false, isPressed: false })),
        onMouseDown: () => setState(s => ({ ...s, isPressed: true })),
        onMouseUp: () => setState(s => ({ ...s, isPressed: false })),
        onTouchStart: () => setState(s => ({ ...s, isPressed: true })),
        onTouchEnd: () => setState(s => ({ ...s, isPressed: false })),
    }), []);

    const style = {
        transform: `scale(${values.scale}) translate3d(${values.x}px, ${values.y}px, 0)`,
        willChange: 'transform',
    };

    return { style, bind, values };
}

/**
 * Presets for common animation patterns
 */
export const SpringPresets = {
    // Gentle, natural movement
    gentle: { tension: 120, friction: 14, mass: 1 },
    // Snappy, responsive
    snappy: { tension: 300, friction: 30, mass: 1 },
    // Bouncy, playful
    bouncy: { tension: 200, friction: 12, mass: 1 },
    // Slow, heavy
    heavy: { tension: 100, friction: 20, mass: 3 },
    // Quick settle
    quick: { tension: 400, friction: 40, mass: 1 },
    // Smooth ease
    smooth: { tension: 150, friction: 22, mass: 1 },
};

export default {
    useSpring,
    useSpringValues,
    useStaggeredSpring,
    useGestureSpring,
    SpringPresets,
};
