import { useEffect, useState } from 'react';

// How many of `length` characters are typed so far. Starts when `start` becomes true, after a short beat,
// at a constant speed (no pauses, no timer jitter).
export function useTypewriter(length, start, { perSecond = 20, delay = 300 } = {}) {
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (!start) return undefined;
    let frame;
    let begin = null;
    const tick = (now) => {
      if (begin === null) begin = now + delay;
      const next = Math.min(length, Math.max(0, Math.floor(((now - begin) / 1000) * perSecond)));
      setTyped(next);
      if (next < length) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [length, start, perSecond, delay]);

  return typed;
}
