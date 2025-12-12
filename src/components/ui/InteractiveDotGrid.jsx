import React, { useEffect, useRef } from 'react';
import { useAnimationsEnabled } from '@/hooks/useAnimationsEnabled';

const InteractiveDotGrid = () => {
    const canvasRef = useRef(null);
    const animationsEnabled = useAnimationsEnabled();

    useEffect(() => {
        if (!animationsEnabled) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];
        let mouse = { x: -1000, y: -1000 };

        const spacing = 50; // Increased for better performance
        const radius = 1.5;
        const hoverRadius = 120;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        };

        const init = () => {
            particles = [];
            for (let x = 0; x < canvas.width; x += spacing) {
                for (let y = 0; y < canvas.height; y += spacing) {
                    particles.push({
                        x,
                        y,
                        baseX: x,
                        baseY: y
                    });
                }
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Repulsion
                if (distance < hoverRadius) {
                    const angle = Math.atan2(dy, dx);
                    const force = (hoverRadius - distance) / hoverRadius;

                    const tx = p.baseX - Math.cos(angle) * 20 * force;
                    const ty = p.baseY - Math.sin(angle) * 20 * force;

                    p.x += (tx - p.x) * 0.15;
                    p.y += (ty - p.y) * 0.15;
                } else {
                    p.x += (p.baseX - p.x) * 0.08;
                    p.y += (p.baseY - p.y) * 0.08;
                }

                // Skip rendering dots that are static and far from mouse
                const distFromBase = Math.abs(p.x - p.baseX) + Math.abs(p.y - p.baseY);
                if (distFromBase < 1 && distance > hoverRadius * 1.5) return;

                ctx.beginPath();
                ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                const opacity = distance < 250 ? Math.max(0.15, 1 - distance / 300) : 0.15;
                ctx.fillStyle = `rgba(99, 102, 241, ${opacity})`;
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        const handleMouseLeave = () => {
            mouse.x = -1000;
            mouse.y = -1000;
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, [animationsEnabled]);

    if (!animationsEnabled) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none opacity-30"
        />
    );
};

export default InteractiveDotGrid;


