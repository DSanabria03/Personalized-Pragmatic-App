// Prepares an illustration exported from Figma to be animated with CSS (".rig" in Home.css). The files stay untouched.
// Layers are found by their Figma number: layer 42 is the element with id "n693-42".
//
// Each rig is one character (or one part of it) that swings back and forth. Its joints share one period,
// so torso, arms and head move together.
//   period  seconds for a full swing there and back
//   joints  [{ nodes, pivot, angle, lag }]
//     nodes  layer numbers moved by this joint
//     pivot  [x, y] of the joint (shoulder, neck, hips) in the illustration's own coordinates
//     angle  degrees it swings to each side; same sign as in Figma: positive = counter-clockwise
//     lag    seconds it runs behind the rest (hair follows the head a beat later)
// A layer in several joints is moved by all of them: list the outer joint (torso) before the inner ones (arm, head).
// If an illustration is exported again from Figma, check that the layer numbers still match.
const SVG_NS = 'http://www.w3.org/2000/svg';

export const range = (first, last) => Array.from({ length: last - first + 1 }, (_, i) => first + i);

export function rigIllustration(source, rigs) {
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');

  // Neighbouring flat shapes show a light hairline in browsers: outline each filled shape with its own colour.
  for (const path of doc.querySelectorAll('path[fill]')) {
    const fill = path.getAttribute('fill');
    if (fill === 'none' || fill.startsWith('url') || path.hasAttribute('stroke')) continue;
    path.setAttribute('stroke', fill);
    path.setAttribute('stroke-width', '1.2');
    path.setAttribute('stroke-linejoin', 'round');
  }

  for (const { period, joints } of rigs) {
    for (const node of new Set(joints.flatMap((joint) => joint.nodes))) {
      let target = doc.getElementById(`n693-${node}`);
      if (!target) throw new Error(`Layer ${node} is not in the illustration`);
      // Wrap from the innermost joint outwards, so the outer joint carries the inner ones.
      const own = joints.filter((joint) => joint.nodes.includes(node)).reverse();
      for (const { pivot: [x, y], angle, lag = 0 } of own) {
        const group = doc.createElementNS(SVG_NS, 'g');
        group.setAttribute('class', 'rig');
        group.setAttribute('style', [
          `transform-origin: ${x}px ${y}px`,
          `--angle: ${-angle}`, // CSS turns clockwise for positive angles, Figma the other way
          `--duration: ${period / 2}s`,
          `--delay: ${-period / 4 + lag}s`, // starts from the resting pose
        ].join('; '));
        target.before(group);
        group.append(target);
        target = group;
      }
    }
  }

  return { __html: new XMLSerializer().serializeToString(doc.documentElement) };
}
