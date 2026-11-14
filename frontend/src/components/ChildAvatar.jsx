import { useEffect, useState } from 'react';

// Muestra la foto del niño o, si no hay (o no carga), su inicial
export default function ChildAvatar({ child, size = 40 }) {
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => setImgFailed(false), [child.avatar]);
  const showImg = child.avatar && !imgFailed;

  return (
    <div
      className="db-avatar"
      style={{ width: size, height: size, background: child.color, fontSize: size * 0.4 }}
    >
      {showImg ? (
        <img src={child.avatar} alt={child.name} onError={() => setImgFailed(true)} />
      ) : (
        child.name.charAt(0)
      )}
    </div>
  );
}
