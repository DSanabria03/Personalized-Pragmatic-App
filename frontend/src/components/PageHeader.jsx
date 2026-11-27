import '../styles/PageHeader.css';

// Header of the redesigned pages. Each page sets --h (the size of one Figma pixel) in its own CSS.
// "children" is what goes on the right side (on Home: My Pip and Log-in).
// "About" and "Help" are in the design but have no screen yet, so they are plain text for now.
export default function PageHeader({ onNavigate, children }) {
  return (
    <header className="page-header">
      <button type="button" className="page-logo" aria-label="Home" onClick={() => onNavigate('go_home')}>
        <img src="/resources/home/logo.png" alt="" />
      </button>
      <nav className="page-nav" aria-label="Main navigation">
        <span className="page-link">About</span>
        <button type="button" className="page-link" onClick={() => onNavigate('go_settings')}>Settings</button>
        <span className="page-link">Help</span>
      </nav>
      {children}
    </header>
  );
}
