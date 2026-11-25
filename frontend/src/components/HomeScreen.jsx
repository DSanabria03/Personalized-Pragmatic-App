import { useEffect, useRef, useState } from 'react';

// One full-screen section of Home. While none of it is on screen ("is-visible" missing) its animations pause.
export default function HomeScreen({ className = '', label, children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const ratio = entries[entries.length - 1].intersectionRatio; // the last one is the current state
      setVisible(ratio >= 0.01); // not "> 0": the browser doesn't report the last step from almost 0 to 0
    }, { threshold: [0, 0.01] });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const classes = ['home-screen', className, visible && 'is-visible'].filter(Boolean);
  return <section ref={ref} className={classes.join(' ')} aria-label={label}>{children}</section>;
}
