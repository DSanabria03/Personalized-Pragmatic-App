import { useState } from 'react';
import AuthLayout from './AuthLayout';
import QuestArt from './QuestArt';
import '../styles/ChildCode.css';

// A line with the child's name in it: if the name is very long, only the name gets cut ("...").
function NameLine({ className = '', before = '', name, after = '' }) {
  return (
    <span className={`new-code-line ${className}`}>
      {before && <span>{before}</span>}
      <span className="new-code-name" title={name}>{name}</span>
      {after && <span>{after}</span>}
    </span>
  );
}

export default function ChildCode({ onNavigate, onOpenProfile, child }) {
  const name = child ? child.name : 'The child';
  const code = child ? child.code : '------';
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this code:', code);
    }
  };
  return (
    <AuthLayout name="new-code" art={<QuestArt />} onNavigate={onNavigate}>
      <p className="auth-eyebrow">Child registered</p>
      <p className="auth-subtitle new-code-subtitle">
        <NameLine before="Share this login code with " name={name} after=" and their grown-up." />
      </p>

      <div className="new-code-box">
        <p className="new-code-title"><NameLine name={name.toUpperCase()} after="’S LOGIN CODE" /></p>
        <p className="new-code-value">{code}</p>
        <p className="new-code-help">Enter this code on the child login screen.</p>
      </div>

      <button type="button" className="auth-submit new-code-copy" onClick={copy}>
        {copied ? 'Copied ✓' : 'Copy login code'}
      </button>
      {/* Opens the browser's print window, where it can be saved as a PDF */}
      <button type="button" className="new-code-download" onClick={() => window.print()}>Download login card</button>

      <div className="new-code-note">
        <p className="new-code-note-title">Keep this code safe.</p>
        <p className="new-code-note-text">
          <NameLine before="Need a new one? Reset it from " name={name} after="’s profile." />
          The previous code will stop working.
        </p>
      </div>

      <button type="button" className="auth-submit new-code-profile" onClick={onOpenProfile}>
        <NameLine before="Go to " name={name} after="’s profile" />
      </button>
    </AuthLayout>
  );
}
