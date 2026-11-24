import { useEffect, useState } from 'react';
import { api } from '../api';
import { PIPS } from '../data/pips';
import AuthLayout from './AuthLayout';
import DiscoveryArt from './DiscoveryArt';
import '../styles/ChildSetup.css';

export default function ChildSetup({ onNavigate, onComplete, initialName = 'Dan', initialPip = null }) {
  const [nickname, setNickname] = useState(initialName);
  const [selectedPip, setSelectedPip] = useState(initialPip);
  const [pops, setPops] = useState(0); // a new number replays the little jump of the Pip just chosen
  const [therapist, setTherapist] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/api/me')
      .then((me) => setTherapist(me.therapist))
      .catch(() => {}); // only a label: the child can still choose their Pip without it
  }, []);

  const choosePip = (id) => {
    setSelectedPip(id);
    setPops((n) => n + 1);
  };

  const handleStart = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onComplete({ nickname, pip: selectedPip }); // saved in the database
      onNavigate('go_child_home');
    } catch (err) {
      setError(err.status ? err.message : 'Could not connect to the server. Is the backend running?');
      setBusy(false);
    }
  };

  const connectedWith = therapist && [therapist.display_name, therapist.practice].filter(Boolean).join(' · ');

  return (
    <AuthLayout name="child-setup" art={<DiscoveryArt />} onNavigate={onNavigate}>
      <p className="auth-eyebrow">Your first little step</p>
      <p className="auth-subtitle">Your therapist has set things up. Now make it yours.</p>

      {error && <p className="auth-error" role="alert">{error}</p>}

      {connectedWith && (
        <p className="child-setup-therapist" title={`Connected with ${connectedWith}`}>Connected with {connectedWith}</p>
      )}

      <form onSubmit={handleStart}>
        <label className="auth-label child-setup-label" htmlFor="child-setup-name">What should Pip call you?</label>
        <input id="child-setup-name" className="auth-input child-setup-input" value={nickname}
          onChange={(e) => setNickname(e.target.value)} placeholder="Dan" required />

        <h2 className="child-setup-title" id="child-setup-title">Choose your Pip</h2>
        <p className="child-setup-subtitle">A friend to discover the world with.</p>

        <div className="child-setup-pips" role="group" aria-labelledby="child-setup-title">
          {PIPS.map((pip, index) => {
            const isSelected = pip.id === selectedPip;
            return (
              <button
                key={pip.id}
                type="button"
                className={`child-setup-pip ${isSelected ? 'is-selected' : ''}`}
                style={{ '--i': index }}
                onClick={() => choosePip(pip.id)}
                aria-pressed={isSelected}
                aria-label={`Pip ${index + 1}`}
              >
                {/* A new key restarts the jump: only after a click, not when the page opens */}
                <span key={isSelected ? pops : 'still'} className={`child-setup-pip-face ${isSelected && pops ? 'is-popping' : ''}`}>
                  <img src={pip.img} alt="" />
                </span>
              </button>
            );
          })}
        </div>

        <button type="submit" className="auth-submit child-setup-submit" disabled={busy}>
          {busy ? 'Saving…' : 'Let’s start exploring'}
        </button>
      </form>
    </AuthLayout>
  );
}
