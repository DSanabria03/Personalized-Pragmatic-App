import '../styles/PadlockArt.css';

const ASSETS = '/resources/login';

// Left card of the log-in and the registration.
//   panel  optional image for its background (without it, plain lavender)
export default function PadlockArt({ panel }) {
  return (
    <>
      {/* From back to front: background, title, characters, circles */}
      <div className="auth-panel">{panel && <img src={panel} alt="" />}</div>
      {/* Same line breaks as the design */}
      <h1 className="auth-title">
        A little{' '}<br />support.{' '}<br />A world{' '}<br />of{' '}<br />discovery.
      </h1>
      <div className="padlock-characters" role="img" aria-label="Two characters holding up a padlock together">
        {/* Twice, like in Figma: the second copy makes the soft edges solid */}
        <img src={`${ASSETS}/characters.png`} alt="" />
        <img src={`${ASSETS}/characters.png`} alt="" />
      </div>
      <img className="padlock-ring" src={`${ASSETS}/ring.svg`} alt="" />
      <img className="padlock-dot-large" src={`${ASSETS}/dot-large.svg`} alt="" />
      <img className="padlock-dot-small" src={`${ASSETS}/dot-small.svg`} alt="" />
    </>
  );
}
