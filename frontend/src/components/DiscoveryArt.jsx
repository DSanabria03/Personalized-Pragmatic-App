import '../styles/DiscoveryArt.css';

const ASSETS = '/resources/child-login';
const CIRCLES = '/resources/login';

// Left card of the child log-in and of "Choose your Pip". Static.
export default function DiscoveryArt() {
  return (
    <>
      {/* From back to front: background, title, characters, circles */}
      <div className="auth-panel discovery-panel" />
      {/* Same line breaks as the design */}
      <h1 className="auth-title">
        Big finds{' '}<br />start{' '}<br />small.
      </h1>
      <div className="discovery-characters" role="img" aria-label="Three children looking at a little plant together">
        {/* Like in Figma: two white fills behind the picture, two small details on top */}
        <img className="discovery-white-large" src={`${ASSETS}/white-large.svg`} alt="" />
        <img className="discovery-white-small" src={`${ASSETS}/white-small.svg`} alt="" />
        <div className="discovery-picture"><img src={`${ASSETS}/characters.png`} alt="" /></div>
        <img className="discovery-detail-left" src={`${ASSETS}/detail-left.svg`} alt="" />
        <div className="discovery-detail-right"><img src={`${ASSETS}/detail-right.svg`} alt="" /></div>
      </div>
      <img className="discovery-ring" src={`${CIRCLES}/ring.svg`} alt="" />
      <img className="discovery-dot-large" src={`${CIRCLES}/dot-large.svg`} alt="" />
      <img className="discovery-dot-small" src={`${CIRCLES}/dot-small.svg`} alt="" />
    </>
  );
}
