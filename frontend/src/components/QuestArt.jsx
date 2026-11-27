import '../styles/QuestArt.css';

const ASSETS = '/resources/quest';

// Left card of "add a child" and of the child's code.
export default function QuestArt() {
  return (
    <>
      {/* From back to front: background with its circles, title, characters */}
      <img className="quest-panel" src={`${ASSETS}/panel.svg`} alt="" />
      {/* Same line breaks as the design */}
      <h1 className="auth-title">
        Their{' '}<br />quest{' '}<br />starts{' '}<br />with you.
      </h1>
      <img className="quest-map" src={`${ASSETS}/map.svg`} alt="An explorer reading a map" />
      <img className="quest-lookout" src={`${ASSETS}/lookout.svg`} alt="An explorer looking into the distance" />
    </>
  );
}
