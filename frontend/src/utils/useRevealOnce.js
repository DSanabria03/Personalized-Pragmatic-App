import { useEffect, useRef, useState } from 'react';

// Becomes true, and stays true, the first time that share (0 to 1) of the element is on screen.
export function useRevealOnce(threshold) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= threshold)) {
        setRevealed(true);
        observer.disconnect();
      }
    }, { threshold });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, revealed];
}
