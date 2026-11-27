import { useEffect, useState } from 'react';
import { api } from '../api';
import TherapistLayout from './TherapistLayout';
import { CATEGORIES } from '../data/activities';
import { sceneName } from '../utils/therapist';
import '../styles/TherapistActivities.css';

// The activities and their exercises (Figma 645:875). Only Hidden requests has exercises for now: the scenes of
// "The secret message", read from the backend (GET /api/stories). The page is read-only: "Add exercise",
// "Save changes", the drag handles and "Support" are shown as in the design but do nothing yet.
// "Preview exercise" plays the story as a guest (nothing is saved) and comes back here.

const icon = (name) => `/resources/therapist/${name}.svg`;

export default function TherapistActivities({ session, onNavigate, onLogout, onPreview }) {
  const [stories, setStories] = useState(null);
  const [error, setError] = useState('');
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    api('/api/stories?language=en')
      .then((d) => setStories(d.stories))
      .catch((e) => (e.status === 401 ? onLogout() : setError(e.message)));
  }, [onLogout]);

  const category = CATEGORIES.find((c) => c.id === categoryId);
  const exercises = (stories || [])
    .filter((s) => s.category === categoryId)
    .flatMap((s) => s.exercises.map((e) => ({ ...e, storyId: s.id })));
  const exercise = exercises[selected] || null;

  const choose = (id) => { setCategoryId(id); setSelected(0); };

  return (
    <TherapistLayout active="activities" session={session} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="ta">
        <header>
          <p className="tl-eyebrow">YOUR PRACTICE</p>
          <h1 className="tl-title">Activities</h1>
          <p className="tl-subtitle">Choose an activity and make the exercises your own.</p>
        </header>

        {error && <p className="tl-error">{error}</p>}

        <div className="ta-library">
          {CATEGORIES.map((c) => {
            const isSelected = c.id === categoryId;
            return (
              <button key={c.id} type="button" className="ta-category" aria-pressed={isSelected} onClick={() => choose(c.id)}>
                <span className="ta-category-top">
                  <img className="ta-category-icon" src={c.icon} alt="" />
                  {isSelected
                    ? <span className="ta-selected"><img src={icon('check')} alt="" />Selected</span>
                    : <img className="ta-open" src={icon('arrow-up-right')} alt="" />}
                </span>
                <span className="ta-category-title">{c.title}</span>
                <span className="ta-category-text">{c.description}</span>
              </button>
            );
          })}
        </div>

        <section className="ta-workspace" aria-label={category.title}>
          <div className="ta-heading">
            <div>
              <h2 className="tl-heading">{category.title}</h2>
              <p className="ta-tagline">{category.tagline || category.description}</p>
            </div>
            <span className="ta-pink"><img src={icon('plus')} alt="" />Add exercise</span>
          </div>

          <div className="ta-body">
            <div className="ta-list">
              <p className="ta-list-head">
                <span>Exercises</span>
                <span>{exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}</span>
              </p>
              {stories && exercises.length === 0 && <p className="ta-empty">No exercises in this activity yet.</p>}
              {exercises.map((e, i) => (
                <button key={`${e.storyId}-${e.id}`} type="button" className="ta-exercise" aria-pressed={i === selected}
                  onClick={() => setSelected(i)}>
                  <img src={icon('grip-vertical')} alt="" />
                  <span className="ta-exercise-text">
                    <span className="ta-exercise-title">{sceneName(e.id)}</span>
                    <span className="ta-exercise-sub">{e.speaker}: “{e.quote}”</span>
                  </span>
                  <img src={icon(i === selected ? 'pencil' : 'chevron-right')} alt="" />
                </button>
              ))}
              {exercises.length > 0 && <p className="ta-hint">Drag the handles to change the order.</p>}
            </div>

            <div className="ta-editor">
              <div className="ta-editor-head">
                <p className="ta-editor-title">Personalize exercise</p>
                <span className="ta-support">Support: Guided<img src={icon('chevron-down-15')} alt="" /></span>
              </div>
              {exercise ? (
                <>
                  <Field label="Exercise title">{sceneName(exercise.id)}</Field>
                  <Field label="Situation & question" tall>
                    {exercise.situation} {exercise.speaker} says, “{exercise.quote}”<br />{exercise.question}
                  </Field>
                  <Field label="Expected meaning">{exercise.hidden_meaning}</Field>
                  <div className="ta-actions">
                    <button type="button" className="ta-preview" onClick={() => onPreview(exercise.storyId)}>
                      <img src={icon('play')} alt="" />Preview exercise
                    </button>
                    <span className="ta-pink">Save changes</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </TherapistLayout>
  );
}

function Field({ label, tall = false, children }) {
  return (
    <div className="ta-field">
      <p className="ta-field-label">{label}</p>
      <p className={`ta-field-box${tall ? ' is-tall' : ''}`}>{children}</p>
    </div>
  );
}
