import { useState } from 'react';
import { api } from '../api';
import AuthLayout from './AuthLayout';
import QuestArt from './QuestArt';
import '../styles/AddChild.css';

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
    <AuthLayout name="add-child" art={<QuestArt />} onNavigate={onNavigate}>
      <p className="auth-eyebrow">Your practice · Add a child</p>
      <p className="auth-subtitle">Register a child to create their profile and login code.</p>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label className="auth-label add-child-label-name" htmlFor="add-child-name">First name or nickname</label>
        <input id="add-child-name" className="auth-input add-child-input-name" name="name"
          value={childForm.name} onChange={handleChildFormChange} placeholder="Dan" required
          aria-describedby="add-child-name-hint" />

        <label className="auth-label add-child-label-age" htmlFor="add-child-age">Age</label>
        <input id="add-child-age" className="auth-input add-child-input-age" name="age"
          value={childForm.age} onChange={handleChildFormChange} placeholder="8 years" required />
        <p id="add-child-name-hint" className="add-child-hint add-child-hint-name">This is the name they’ll see in Pip.</p>

        <label className="auth-label add-child-label-email" htmlFor="add-child-email">Parent or guardian email (optional)</label>
        <input id="add-child-email" className="auth-input add-child-input-email" type="email" name="parentEmail"
          value={childForm.parentEmail} onChange={handleChildFormChange} placeholder="parent@example.com"
          aria-describedby="add-child-email-hint" />
        <p id="add-child-email-hint" className="add-child-hint add-child-hint-email">
          For sharing the login details. Not needed for the child to log in.
        </p>

        <div className="add-child-therapist">
          <span className="add-child-therapist-title">Assigned therapist</span>
          <span className="add-child-therapist-name" title={therapistName || 'You'}>{therapistName || 'You'}</span>
        </div>

        <input id="add-child-permission" className="auth-checkbox add-child-checkbox" type="checkbox" name="acceptedPermission"
          checked={childForm.acceptedPermission} onChange={handleChildFormChange} required />
        <label className="add-child-permission" htmlFor="add-child-permission">
          I confirm I have parent or guardian permission to create{' '}<br />and manage this child’s account.
        </label>

        <button type="submit" className="auth-submit add-child-submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create child profile & login code'}
        </button>
      </form>

      <button type="button" className="add-child-cancel" onClick={() => onNavigate('go_dashboard')}>
        Cancel and return to children
      </button>
    </AuthLayout>
  );
}
