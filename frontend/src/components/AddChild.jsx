import { useState } from 'react';
import { api } from '../api';

export default function AddChild({ onNavigate, therapistName, onCreated }) {
  const [childForm, setChildForm] = useState({ name: '', age: '', parentEmail: '', acceptedPermission: false });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const child = await api('/api/children', {
        method: 'POST',
        body: { name: childForm.name, age: childForm.age, parent_email: childForm.parentEmail },
      });
      onCreated(child); // -> shows the new login code
    } catch (err) {
      setError(err.status ? err.message : 'Could not connect to the server. Is the backend running?');
    } finally {
      setBusy(false);
    }
  };

  const handleChildFormChange = (event) => {
    const { name, value, checked, type } = event.target;
    setChildForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <>
      <header className="register-header">
        <div className="register-header-left">
          <button type="button" className="register-logo" onClick={() => onNavigate('go_home')}>••</button>
          <span style={{ fontWeight: 'bold', borderBottom: '2px solid #101914', paddingBottom: '8px' }}>Add a child</span>
        </div>
        <nav className="register-nav">
          <button type="button" onClick={() => onNavigate('go_dashboard')}>Dashboard</button>
          <button type="button" onClick={() => onNavigate('go_settings')}>Settings</button>
        </nav>
      </header>

      <main className="register-main">
        <aside className="left-card">
          <div>
            <h1 style={{ fontSize: 'clamp(32px, 3.5vw, 56px)', fontWeight: '900', fontFamily: 'monospace', lineHeight: 1.15 }}>Their adventure<br />starts with you.</h1>
            <p style={{ marginTop: '16px', fontSize: '15px', color: '#374151' }}>Create a child profile in your practice. We’ll make a code for them to log in.</p>
          </div>

          <div className="figma-right-art-container">
            <img src="/resources/register-characters.png" alt="Add Child Characters" className="figma-right-art-img" />
          </div>

          <p style={{ fontSize: '13px', color: '#555', position: 'relative', zIndex: 2 }}>No child email or password needed.</p>
        </aside>

        <section className="register-content">
          <p className="register-step">YOUR PRACTICE · ADD A CHILD</p>
          <h2>A new little explorer.</h2>
          <p className="register-description">Register a child to create their profile and login code.</p>

          {error && <div style={{ color: '#b00020', marginBottom: '10px', fontSize: '14px' }}>{error}</div>}
          <form className="register-form" onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <label>First name or nickname<input name="name" value={childForm.name} onChange={handleChildFormChange} placeholder="Dan" required /></label>
              <label>Age<input name="age" value={childForm.age} onChange={handleChildFormChange} placeholder="8 years" required /></label>
            </div>
            <small style={{ marginTop: '-10px', display: 'block' }}>This is the name they'll see in Pip.</small>

            <label style={{ marginTop: '10px' }}>Parent or guardian email (optional)<input type="email" name="parentEmail" value={childForm.parentEmail} onChange={handleChildFormChange} placeholder="parent@example.com" /></label>
            <small style={{ marginTop: '-10px', display: 'block' }}>For sharing the login details. Not needed for the child to log in.</small>

            <div style={{ background: '#e5f0ff', padding: '16px', borderRadius: '16px', margin: '10px 0' }}>
              <span style={{ fontSize: '11px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase' }}>Assigned therapist</span>
              <div style={{ fontWeight: 'bold', color: '#111', marginTop: '4px' }}>{therapistName || 'You'}</div>
            </div>

            <label className="register-terms">
              <input type="checkbox" name="acceptedPermission" checked={childForm.acceptedPermission} onChange={handleChildFormChange} required />
              <span>I confirm I have parent or guardian permission to create and manage this child's account.</span>
            </label>

            <button type="submit" className="register-submit" disabled={busy}>{busy ? 'Creating…' : 'Create child profile & login code'}</button>
          </form>

          <button type="button" className="register-back-link" onClick={() => onNavigate('go_dashboard')}>
            Cancel and return to children
          </button>
        </section>
      </main>
    </>
  );
}