import { useEffect, useRef, useState } from 'react';

// One full-screen section of Home.
//   is-visible   some of it is on screen: its animations run (they pause when it is out of view)
//   has-entered  it has been properly seen at least once: its entrance animation plays
export default function HomeScreen({ className = '', label, children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const ratio = entries[entries.length - 1].intersectionRatio; // the last one is the current state
      setVisible(ratio >= 0.01); // not "> 0": the browser doesn't report the last step from almost 0 to 0
      if (ratio >= 0.35) setEntered(true);
    }, { threshold: [0, 0.01, 0.35] });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const classes = ['home-screen', className, visible && 'is-visible', entered && 'has-entered'].filter(Boolean);
  return <section ref={ref} className={classes.join(' ')} aria-label={label}>{children}</section>;
}
