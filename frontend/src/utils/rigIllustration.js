// Prepares an SVG exported from Figma to be animated with CSS. The files themselves stay untouched.
//   name         prefix for the layer ids: several illustrations share the page and Figma repeats ids ("Vector_2"...)
//   parts        [class, first layer, last layer]: those neighbouring layers are wrapped in a group with that class.
//                Outer groups must come before the groups inside them.
//   stillCopies  layers that get a still copy behind them, so no gap opens when the real one moves.
// If an illustration is exported again from Figma, check that the layer ids in its "parts" still match.
export function rigIllustration(source, { name, parts, stillCopies = [] }) {
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  const layer = (id) => {
    const found = doc.getElementById(id);
    if (!found) throw new Error(`Layer "${id}" is not in the "${name}" illustration`);
    return found;
  };

  // The Figma frame clips at its edges, which would cut whatever moves past them.
  doc.querySelectorAll('g[clip-path]').forEach((group) => group.removeAttribute('clip-path'));

  for (const id of stillCopies) {
    const copy = layer(id).cloneNode();
    copy.removeAttribute('id');
    layer(id).before(copy);
  }

  for (const [className, firstId, lastId] of parts) {
    const first = layer(firstId);
    const last = layer(lastId);
    const group = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', className);
    first.before(group);
    while (group.lastElementChild !== last) group.append(group.nextElementSibling);
  }

  for (const element of doc.querySelectorAll('*')) {
    for (const attribute of [...element.attributes]) {
      const { localName, value } = attribute;
      if (localName === 'id') attribute.value = `${name}-${value}`;
      else if (localName === 'href' && value.startsWith('#')) attribute.value = `#${name}-${value.slice(1)}`;
      else if (value.startsWith('url(#')) attribute.value = `url(#${name}-${value.slice(5)}`;
    }
  }

  return { __html: new XMLSerializer().serializeToString(doc.documentElement) };
}
