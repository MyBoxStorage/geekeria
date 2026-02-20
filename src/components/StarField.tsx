import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  color: string;
}

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize stars
    const starCount = 120;
    const stars: Star[] = [];

    for (let i = 0; i < starCount; i++) {
      const isCosmos = Math.random() > 0.7;
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 0.5 + Math.random() * 1,
        opacity: 0.1 + Math.random() * 0.25,
        speed: 0.08 + Math.random() * 0.07,
        color: isCosmos ? '#38A7FF' : '#FFFFFF',
      });
    }

    starsRef.current = stars;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      starsRef.current.forEach((star) => {
        // Update position
        star.y += star.speed;

        // Reset if out of bounds
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }

        // Draw star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.opacity;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
}

export default StarField;
