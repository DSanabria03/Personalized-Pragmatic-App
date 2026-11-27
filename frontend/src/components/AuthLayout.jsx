import PageHeader from './PageHeader';
import '../styles/AuthLayout.css';

// What the therapist's form pages share (log-in, registration, add a child and its code): header and two cards.
//   name      class of the page, for its own CSS
//   art       the left card: PadlockArt or QuestArt
//   children  what goes inside the right card
export default function AuthLayout({ name, art, onNavigate, children }) {
  return (
    <div className={`auth ${name}`}>
      <PageHeader onNavigate={onNavigate} />

      <main className="auth-screen">
        <div className="auth-stage">
          {art}
          <div className="auth-card" />
          <div className="auth-content">{children}</div>
        </div>
      </main>
    </div>
  );
}
