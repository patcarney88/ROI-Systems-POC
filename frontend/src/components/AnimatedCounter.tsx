import { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: boolean;
  className?: string;
}

export default function AnimatedCounter({
  end,
  duration = 2000,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = false,
  className = ''
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number>();

  useEffect(() => {
    // Easing function (easeOutQuart for smooth deceleration)
    const easeOutQuart = (t: number): number => {
      return 1 - Math.pow(1 - t, 4);
    };

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Apply easing
      const easedProgress = easeOutQuart(progress);
      const currentCount = easedProgress * end;

      countRef.current = currentCount;
      setCount(currentCount);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration]);

  const formatNumber = (value: number): string => {
    let formatted = value.toFixed(decimals);

    if (separator) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formatted = parts.join('.');
    }

    return `${prefix}${formatted}${suffix}`;
  };

  return <span className={className}>{formatNumber(count)}</span>;
}
