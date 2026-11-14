import { useState } from 'react';
import TherapistLayout from './TherapistLayout';
import Icon from './Icons';
import { INITIAL_ACTIVITIES, SUPPORT_OPTIONS } from '../data/mockData';

export default function TherapistActivities({ onNavigate }) {
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [activityId, setActivityId] = useState('hidden');
  const [exerciseId, setExerciseId] = useState('h1');
  const [draft, setDraft] = useState(INITIAL_ACTIVITIES[0].exercises[0]);
  const [dragIndex, setDragIndex] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);

  const activity = activities.find((a) => a.id === activityId);

  const selectActivity = (id) => {
    const act = activities.find((a) => a.id === id);
    setActivityId(id);
    setExerciseId(act.exercises[0]?.id || null);
    setDraft(act.exercises[0] || null);
    setShowPreview(false);
  };

  const selectExercise = (ex) => {
    setExerciseId(ex.id);
    setDraft(ex);
    setShowPreview(false);
  };

  // Actualiza los ejercicios de la actividad seleccionada
  const updateExercises = (fn) => {
    setActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, exercises: fn(a.exercises) } : a)));
  };

  const handleSave = () => {
    updateExercises((list) => list.map((ex) => (ex.id === draft.id ? draft : ex)));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAdd = () => {
    const newEx = {
      id: `ex-${Date.now()}`, title: 'New exercise', subtitle: 'Write a short description', support: 'Guided',
      situation: '', meaning: '',
    };
    updateExercises((list) => [...list, newEx]);
    selectExercise(newEx);
  };

  // Arrastrar para reordenar
  const handleDrop = (dropIndex) => {
    if (dragIndex === null || dragIndex === dropIndex) return;
    updateExercises((list) => {
      const copy = [...list];
      const [moved] = copy.splice(dragIndex, 1);
      copy.splice(dropIndex, 0, moved);
      return copy;
    });
    setDragIndex(null);
  };

  return (
    <TherapistLayout active="activities" onNavigate={onNavigate}>
      <div className="db-page-header">
        <div>
          <p className="db-eyebrow">Your practice</p>
          <h1 className="db-title">Activities</h1>
          <p className="db-subtitle">Choose an activity and make the exercises your own.</p>
        </div>
      </div>

      <div className="db-activity-grid">
        {activities.map((a) => {
          const isSel = a.id === activityId;
          return (
            <button key={a.id} type="button" className={`db-activity-card ${isSel ? 'is-selected' : ''}`} onClick={() => selectActivity(a.id)}>
              <div className="db-activity-card-top">
                <Icon name={a.icon} size={20} />
                {isSel ? <span className="db-selected-tag"><Icon name="check" size={12} /> Selected</span> : <Icon name="arrowUpRight" size={16} />}
              </div>
              <h3>{a.title}</h3>
              <p>{a.desc}</p>
            </button>
          );
        })}
      </div>

      <section className="db-card db-editor">
        <div className="db-editor-header">
          <div>
            <h2 className="db-section-title db-section-title--lg">{activity.title}</h2>
            <p className="db-small">{activity.tagline}</p>
          </div>
          <button type="button" className="db-btn-primary" onClick={handleAdd}><Icon name="plus" /> Add exercise</button>
        </div>

        <div className="db-editor-body">
          <div className="db-exercise-list">
            <div className="db-progress-label"><strong>Exercises</strong><small>{activity.exercises.length} exercises</small></div>
            {activity.exercises.map((ex, index) => {
              const isSel = ex.id === exerciseId;
              return (
                <div
                  key={ex.id}
                  className={`db-exercise-item ${isSel ? 'is-selected' : ''}`}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(index)}
                  onClick={() => selectExercise(ex)}
                >
                  <Icon name="grip" size={16} className="db-grip" />
                  <div><strong>{ex.title}</strong><small>{ex.subtitle}</small></div>
                  <Icon name={isSel ? 'pencil' : 'chevronRight'} size={16} />
                </div>
              );
            })}
            <p className="db-small">Drag the handles to change the order.</p>
          </div>

          {draft ? (
            <div className="db-exercise-form">
              <div className="db-progress-label">
                <strong>Personalize exercise</strong>
                <select className="db-select db-select--inline" value={draft.support} onChange={(e) => setDraft({ ...draft, support: e.target.value })}>
                  {SUPPORT_OPTIONS.map((s) => <option key={s} value={s}>Support: {s}</option>)}
                </select>
              </div>

              <label className="db-field">Exercise title
                <input className="db-input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </label>
              <label className="db-field">Situation & question
                <textarea className="db-input" rows={3} value={draft.situation} onChange={(e) => setDraft({ ...draft, situation: e.target.value })} />
              </label>
              <label className="db-field">Expected meaning
                <input className="db-input" value={draft.meaning} onChange={(e) => setDraft({ ...draft, meaning: e.target.value })} />
              </label>

              {showPreview && (
                <div className="db-preview">
                  <p className="db-eyebrow">What the child will see</p>
                  <p className="db-preview-text">{draft.situation || 'Write a situation first.'}</p>
                </div>
              )}

              <div className="db-form-actions">
                <button type="button" className="db-link" onClick={() => setShowPreview((v) => !v)}>
                  <Icon name="play" size={14} /> {showPreview ? 'Hide preview' : 'Preview exercise'}
                </button>
                <button type="button" className="db-btn-primary" onClick={handleSave}>
                  {saved ? <><Icon name="check" /> Saved</> : 'Save changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="db-exercise-form db-empty">No exercises yet. Add one to start.</div>
          )}
        </div>
      </section>

      <p className="db-footnote">Illustrative exercises · Adapt the language and support to each child’s needs.</p>
    </TherapistLayout>
  );
}
