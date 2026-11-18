import { useCallback, useEffect, useRef, useState } from 'react';
import { API, api } from '../api';

// Play screen for one story.
// 1. Pip (speech bubble on the left) tells what is happening, the customer (bubble on the right) says something.
// 2. The child picks a picture. Pip "does" that action, the customer reacts (emoji + sentence), then Pip reacts.
// 3. After the first choice that doesn't fit, the game pauses so the therapist / grown-up can talk it through.
// Language, voice and the grown-up pause come from the Settings screen (they can't change during a story).
// Voice: ElevenLabs or Piper from the backend, else the browser's voice.
// If a child is logged in, every answer is saved (their progress + the therapist's dashboard).
//
// Usage in App.jsx:
//   <StoryPlay storyId="the_secret_message" language="en" voice therapistPause
//     onExit={() => ...} onFinished={(result) => ...} />
// Optional: pipIdle / pipTalking = paths to Pip's GIFs (e.g. "/resources/pip_idle.gif").

const UI = {
  en: {
    exit: 'Exit',
    next: 'Continue →',
    home: 'Back home',
    loading: 'Loading story…',
    talkTitle: "Let's talk about it together",
    talkText: (name) => `Take a moment: what do you think ${name} really wants? Talk about it with your grown-up, then try again.`,
    grownUp: 'For the grown-up',
    ask: (name, quote) => `Ask: why did ${name} say “${quote}”? What does ${name} need?`,
    clue: 'Clue',
    show: 'Show the hidden meaning',
    hide: 'Hide',
    again: 'Try again',
    error: 'Something went wrong:',
    backend: 'Is the backend running on',
    back: 'Back',
    results: 'See how you did ⭐',
  },
  it: {
    exit: 'Esci',
    next: 'Avanti →',
    home: 'Torna alla home',
    loading: 'Caricamento della storia…',
    talkTitle: 'Parliamone insieme',
    talkText: (name) => `Prenditi un momento: secondo te cosa vuole davvero ${name}? Parlane con un adulto, poi riprova.`,
    grownUp: "Per l'adulto",
    ask: (name, quote) => `Chiedi: perché ${name} ha detto “${quote}”? Di cosa ha bisogno ${name}?`,
    clue: 'Indizio',
    show: 'Mostra il significato nascosto',
    hide: 'Nascondi',
    again: 'Riprova',
    error: 'Qualcosa è andato storto:',
    backend: 'Il backend è avviato su',
    back: 'Indietro',
    results: 'Guarda come è andata ⭐',
  },
};

const EMOJI = { happy: '😊', sad: '😢', confused: '😕', surprised: '😲', neutral: '🙂' };
const ACTION_MS = 1600; // how long Pip's action is shown before the customer reacts (later: length of the GIF)

const post = (path, body) => api(path, { method: 'POST', body });

export default function StoryPlay({
  storyId = 'the_secret_message',
  language = 'en',
  pipName = 'Pip',
  pipIdle = '/resources/pip_idle.gif',
  pipTalking = '/resources/pip_talking.gif',
  childName = null, // only for guests: a logged-in child's name comes from their account
  voice = true, // false: no sound, the sentences are only shown
  therapistPause = true, // pause after Pip's first guiding question so the grown-up can talk it through
  onExit,
  onFinished, // called with the results (summary, progress, new badges) -> "Great job" screen
}) {
  const lang = language === 'it' ? 'it' : 'en';
  const t = UI[lang];
  const [story, setStory] = useState(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  // phase: loading -> narrating -> choosing -> waiting -> acting -> (talk) -> feedback ... -> finished
  const [phase, setPhase] = useState('loading');
  const [pipLine, setPipLine] = useState('');
  const [customerLine, setCustomerLine] = useState(null); // { name, text, emotion, note }
  const [speaking, setSpeaking] = useState(null); // 'pip' | 'customer' | null
  const [thinking, setThinking] = useState(false); // waiting for Pip's AI
  const [attempt, setAttempt] = useState(1);
  const [tried, setTried] = useState([]);
  const [revealed, setRevealed] = useState(null);
  const [action, setAction] = useState(null); // { text, image, animation } what Pip is doing
  const [grownUp, setGrownUp] = useState(null); // { hint, hidden_meaning } for the talk pause
  const [showMeaning, setShowMeaning] = useState(false);
  const [solved, setSolved] = useState([]);
  const [error, setError] = useState('');
  const [finishedTalking, setFinishedTalking] = useState(false);
  const [pipImageOk, setPipImageOk] = useState(true);
  const [elevenLabs, setElevenLabs] = useState(false);

  const [finishData, setFinishData] = useState(null);
  const runIdRef = useRef(null); // this play-through in the database (logged-in child)
  const resultsRef = useRef({}); // per scene: { scene_id, attempts, solved }
  const run = useRef(0); // goes up when the story (re)starts: older async steps then stop
  const sceneIndexRef = useRef(0);
  const stopSpeech = useRef(() => {});
  const audioRef = useRef(null);

  // Which voice does the backend have? "elevenlabs", "piper" or "browser". Asked once.
  const ttsProvider = useRef(null);
  if (ttsProvider.current === null) {
    ttsProvider.current = fetch(`${API}/api/tts/status`)
      .then((r) => r.json())
      .then((d) => d.provider || 'browser')
      .catch(() => 'browser');
  }
  useEffect(() => {
    ttsProvider.current.then((provider) => setElevenLabs(provider === 'elevenlabs'));
  }, []);

  const stopAll = useCallback(() => {
    run.current += 1;
    stopSpeech.current();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (audioRef.current) audioRef.current.pause();
  }, []);

  // Browser's built-in voice (used when the backend has no voice).
  const speakWithBrowser = useCallback(
    (text, done) => {
      if (!('speechSynthesis' in window)) {
        done();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'it' ? 'it-IT' : 'en-US';
      utterance.rate = 0.95;
      utterance.onend = done;
      utterance.onerror = done;
      window.speechSynthesis.speak(utterance);
    },
    [lang],
  );

  // Read text aloud as "pip" or "customer"; the speaker's bubble lights up meanwhile.
  const speak = useCallback(
    (text, who) =>
      new Promise((resolve) => {
        if (!text) {
          resolve();
          return;
        }
        let finished = false;
        let safety = null;
        const done = () => {
          if (finished) return;
          finished = true;
          clearTimeout(safety);
          setSpeaking(null);
          resolve();
        };
        stopSpeech.current = done;
        setSpeaking(who);
        if (!voice) {
          // Sound off in Settings: show the sentence for about the time it takes to read it.
          safety = setTimeout(done, 1200 + text.length * 55);
          return;
        }
        // Safety net: if the audio never reports that it ended, continue after roughly the speaking time.
        const startSafety = (extraMs = 0) => {
          clearTimeout(safety);
          safety = setTimeout(done, 2500 + text.length * 90 + extraMs);
        };
        startSafety(60000); // generous while the backend makes the audio (first Piper voice download)

        ttsProvider.current
          .then((provider) => {
            if (provider === 'browser') throw new Error('no backend voice');
            return fetch(`${API}/api/tts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text, language: lang, speaker: who }),
            });
          })
          .then((r) => {
            if (!r.ok) throw new Error(`tts ${r.status}`);
            return r.blob();
          })
          .then((blob) => {
            if (finished) return;
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;
            const end = () => {
              URL.revokeObjectURL(url);
              done();
            };
            audio.onended = end;
            audio.onerror = end;
            startSafety();
            return audio.play();
          })
          .catch(() => {
            if (finished) return;
            startSafety();
            speakWithBrowser(text, done);
          });
      }),
    [lang, voice, speakWithBrowser],
  );

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const playScene = useCallback(
    async (loadedStory, index, myRun) => {
      const scene = loadedStory.scenes[index];
      sceneIndexRef.current = index;
      setSceneIndex(index);
      setAttempt(1);
      setTried([]);
      setRevealed(null);
      setAction(null);
      setGrownUp(null);
      setShowMeaning(false);
      setCustomerLine(null);
      setPhase('narrating');
      setPipLine('');
      setThinking(true);
      try {
        const data = await post(`/api/stories/${storyId}/narrate`, {
          scene_id: scene.id, language: lang, pip_name: pipName, child_name: childName,
        });
        if (run.current !== myRun) return;
        setThinking(false);
        setPipLine(data.narration);
        await speak(data.narration, 'pip');
        if (run.current !== myRun) return;
        setCustomerLine({ name: data.speaker, text: data.quote, emotion: null, note: '' });
        await speak(data.quote, 'customer'); // the customer's exact sentence from the story file
        if (run.current === myRun) setPhase('choosing');
      } catch (e) {
        if (run.current === myRun) setError(String(e));
      }
    },
    [storyId, lang, pipName, childName, speak],
  );

  // Load the story (again when the language changes) and play the current scene.
  useEffect(() => {
    stopAll();
    const myRun = run.current;
    setStory(null);
    setPhase('loading');
    fetch(`${API}/api/stories/${storyId}?language=${lang}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Story '${storyId}' could not be loaded (${r.status})`);
        return r.json();
      })
      .then(async (data) => {
        if (run.current !== myRun) return;
        setStory(data);
        resultsRef.current = {};
        runIdRef.current = null;
        try {
          const started = await post(`/api/stories/${storyId}/start`, { language: lang });
          runIdRef.current = started.run_id;
        } catch {
          /* not logged in or backend busy: play without saving */
        }
        if (run.current !== myRun) return;
        playScene(data, sceneIndexRef.current, myRun);
      })
      .catch((e) => run.current === myRun && setError(String(e)));
    return stopAll;
  }, [storyId, lang, playScene, stopAll]);

  const choose = async (optionId) => {
    if (phase !== 'choosing') return;
    const myRun = run.current;
    const scene = story.scenes[sceneIndex];
    setPhase('waiting');
    setTried((list) => [...list, optionId]);
    setThinking(true);
    try {
      const r = await post(`/api/stories/${storyId}/answer`, {
        scene_id: scene.id, child_answer: optionId, attempt, language: lang,
        pip_name: pipName, child_name: childName, run_id: runIdRef.current,
      });
      if (run.current !== myRun) return;
      const result = resultsRef.current[scene.id] || { scene_id: scene.id, attempts: 0, solved: false };
      result.attempts = attempt;
      if (r.is_correct) result.solved = true;
      resultsRef.current[scene.id] = result;

      // 1) Pip does what the child chose (later: an animation of Pip doing it)
      setAction(r.action);
      setPhase('acting');
      await wait(ACTION_MS);
      if (run.current !== myRun) return;

      // 2) The customer reacts
      setCustomerLine({
        name: r.reaction.speaker, text: r.reaction.says, emotion: r.reaction.emotion, note: r.reaction.description,
      });
      await speak(r.reaction.says, 'customer');
      if (run.current !== myRun) return;

      // 3) Pip reacts (written by the AI)
      if (r.scene_done) {
        setRevealed(r.correct_answer);
        if (r.is_correct) setSolved((list) => [...list, scene.id]);
      }
      setThinking(false);
      setPipLine(r.speech);
      await speak(r.speech, 'pip');
      if (run.current !== myRun) return;

      if (r.scene_done) {
        setPhase('feedback');
      } else if (r.outcome === 'retry' && therapistPause) {
        setGrownUp(r.for_grown_up || null);
        setPhase('talk'); // pause: the grown-up talks it through with the child
      } else {
        setAttempt((a) => a + 1);
        setAction(null);
        setPhase('choosing');
      }
    } catch (e) {
      if (run.current === myRun) setError(String(e));
    }
  };

  const tryAgain = () => {
    setAttempt((a) => a + 1);
    setAction(null);
    setShowMeaning(false);
    setPhase('choosing');
  };

  const next = async () => {
    const myRun = run.current;
    if (sceneIndex + 1 < story.scenes.length) {
      playScene(story, sceneIndex + 1, myRun);
      return;
    }
    setPhase('finished');
    setAction(null);
    setCustomerLine(null);
    setPipLine('');
    setThinking(true);
    const data = await post(`/api/stories/${storyId}/finish`, {
      language: lang, pip_name: pipName, child_name: childName, solved_scene_ids: solved,
      run_id: runIdRef.current, results: Object.values(resultsRef.current),
    }).catch(() => ({ speech: '', summary: null }));
    if (run.current !== myRun) return;
    setFinishData(data);
    setThinking(false);
    setPipLine(data.speech);
    await speak(data.speech, 'pip');
    if (run.current === myRun) setFinishedTalking(true);
  };

  if (error) {
    return (
      <main style={styles.page}>
        <p>{t.error} {error}</p>
        <p>{t.backend} {API}?</p>
        <button type="button" onClick={onExit}>{t.back}</button>
      </main>
    );
  }

  const scene = story ? story.scenes[sceneIndex] : null;
  const showOptions = scene && ['choosing', 'waiting', 'acting', 'talk', 'feedback'].includes(phase);

  return (
    <main style={styles.page}>
      <style>{CSS}</style>

      {/* Top bar: title, progress, language switch, exit */}
      <header style={styles.header}>
        <div>
          <div style={{ fontWeight: 'bold' }}>{story ? story.title : t.loading}</div>
          {story && <div style={styles.setting}>{story.setting.toUpperCase()}</div>}
        </div>
        {story && (
          <div style={{ display: 'flex', gap: '6px' }} aria-label="progress">
            {story.scenes.map((s, i) => (
              <span key={s.id} style={{ ...styles.dot, background: i < sceneIndex || phase === 'finished' ? '#2e9e5b' : i === sceneIndex ? '#6e42c1' : '#d2d9d0' }} />
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button type="button" onClick={() => { stopAll(); onExit && onExit(); }} style={styles.exit}>{t.exit}</button>
        </div>
      </header>

      {/* Stage: picture + the two speakers */}
      <section style={styles.stage}>
        {phase !== 'finished' && scene && (
          <div style={{ position: 'relative', alignSelf: 'center' }}>
            {action ? (
              // Pip doing the chosen action. Later: <img src={action.animation}> with Pip's GIF.
              <figure className="sp-action" style={{ margin: 0, textAlign: 'center' }}>
                <img src={action.animation || action.image} alt="" style={styles.sceneImg} />
                <figcaption style={styles.actionCaption}>▶ {action.text}</figcaption>
              </figure>
            ) : (
              scene.image && <img src={scene.image} alt="" style={styles.sceneImg} />
            )}
          </div>
        )}

        <div style={styles.speakers}>
          {/* Pip on the left */}
          <div style={styles.speakerRow}>
            <div className={`sp-avatar ${speaking === 'pip' ? 'sp-speaking' : ''}`} style={{ ...styles.avatar, background: '#efe9ff' }}>
              {pipImageOk ? (
                <img src={speaking === 'pip' ? pipTalking : pipIdle} alt={pipName} style={styles.avatarImg}
                  onError={() => setPipImageOk(false)} />
              ) : (
                <span style={{ fontWeight: 'bold', color: '#6e42c1' }}>{pipName}</span>
              )}
            </div>
            <div>
              <div style={styles.name}>{pipName}</div>
              <div className={`sp-bubble sp-left ${speaking === 'pip' ? 'sp-bubble-active' : ''}`}>
                {thinking ? <span className="sp-dots" aria-label="Pip is thinking"><i /><i /><i /></span> : pipLine}
              </div>
            </div>
          </div>

          {/* The customer on the right */}
          {customerLine && (
            <div style={{ ...styles.speakerRow, flexDirection: 'row-reverse', textAlign: 'right' }}>
              <div className={`sp-avatar ${speaking === 'customer' ? 'sp-speaking' : ''}`} style={{ ...styles.avatar, background: '#fff3e0' }}>
                <span style={{ fontSize: customerLine.emotion ? '34px' : '24px', fontWeight: 'bold', color: '#b26a00' }}>
                  {customerLine.emotion ? EMOJI[customerLine.emotion] || EMOJI.neutral : customerLine.name.charAt(0)}
                </span>
              </div>
              <div>
                <div style={styles.name}>{customerLine.name}</div>
                <div className={`sp-bubble sp-right ${speaking === 'customer' ? 'sp-bubble-active' : ''}`}>
                  “{customerLine.text}”
                </div>
                {customerLine.note && <div style={styles.note}>{customerLine.note}</div>}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pause for the grown-up after Pip's guiding question */}
      {phase === 'talk' && scene && (
        <section className="sp-talk" style={styles.talk}>
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>💬 {t.talkTitle}</div>
          <p style={{ margin: '6px 0 12px' }}>{t.talkText(scene.speaker)}</p>
          <details style={styles.grownUp}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>{t.grownUp}</summary>
            <p style={{ margin: '8px 0' }}>{t.ask(scene.speaker, scene.quote)}</p>
            {grownUp && grownUp.hint && <p style={{ margin: '8px 0' }}><strong>{t.clue}:</strong> {grownUp.hint}</p>}
            {grownUp && grownUp.hidden_meaning && (
              <p style={{ margin: '8px 0' }}>
                <button type="button" style={styles.linkButton} onClick={() => setShowMeaning((v) => !v)}>
                  {showMeaning ? t.hide : t.show}
                </button>
                {showMeaning && <span> {grownUp.hidden_meaning}</span>}
              </p>
            )}
          </details>
          <button type="button" className="register-submit" style={{ marginTop: '12px' }} onClick={tryAgain}>{t.again}</button>
        </section>
      )}

      {/* The three pictures */}
      {showOptions && (
        <section>
          <p style={{ fontWeight: 'bold' }}>{scene.question}</p>
          <div style={styles.options}>
            {scene.options.map((option) => {
              const isRight = revealed === option.id;
              const isTried = tried.includes(option.id) && !isRight;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={phase !== 'choosing' || isTried}
                  onClick={() => choose(option.id)}
                  style={{
                    ...styles.option,
                    borderColor: isRight ? '#2e9e5b' : '#d2d9d0',
                    opacity: isTried || (revealed && !isRight) ? 0.45 : 1,
                    color: '#111',
                    cursor: phase === 'choosing' && !isTried ? 'pointer' : 'default',
                  }}
                >
                  {option.image && <img src={option.image} alt="" style={styles.optionImg} />}
                  <span><strong>{option.id}</strong> · {option.text}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {phase === 'feedback' && !speaking && (
        <button type="button" className="register-submit" onClick={next}>{t.next}</button>
      )}
      {phase === 'finished' && finishedTalking && (
        <button type="button" className="register-submit"
          onClick={() => { stopAll(); if (onFinished) onFinished(finishData); else if (onExit) onExit(); }}>
          {onFinished ? t.results : t.home}
        </button>
      )}
      {elevenLabs && <p style={{ fontSize: '11px', color: '#888', textAlign: 'right' }}>Voice: ElevenLabs</p>}
    </main>
  );
}

// Speech bubbles, the "speaking" glow and the thinking dots.
const CSS = `
.sp-bubble { position: relative; background: #fff; border: 3px solid #e5e1d8; border-radius: 20px; padding: 14px 18px;
  font-size: 18px; line-height: 1.4; min-height: 28px; max-width: 560px; transition: border-color .2s, box-shadow .2s; }
.sp-left::before, .sp-right::before { content: ''; position: absolute; top: 18px; border: 10px solid transparent; }
.sp-left::before { left: -21px; border-right-color: #e5e1d8; }
.sp-right::before { right: -21px; border-left-color: #e5e1d8; }
.sp-bubble-active { border-color: #6e42c1; box-shadow: 0 0 0 4px rgba(110, 66, 193, .15); }
.sp-left.sp-bubble-active::before { border-right-color: #6e42c1; }
.sp-right.sp-bubble-active { border-color: #e08a00; box-shadow: 0 0 0 4px rgba(224, 138, 0, .15); }
.sp-right.sp-bubble-active::before { border-left-color: #e08a00; }
.sp-avatar { transition: transform .2s; }
.sp-speaking { animation: sp-bounce .6s ease-in-out infinite alternate; }
@keyframes sp-bounce { from { transform: translateY(0) scale(1); } to { transform: translateY(-4px) scale(1.05); } }
.sp-dots i { display: inline-block; width: 8px; height: 8px; margin: 0 3px; border-radius: 50%; background: #6e42c1;
  animation: sp-dot 1s infinite ease-in-out; }
.sp-dots i:nth-child(2) { animation-delay: .15s; } .sp-dots i:nth-child(3) { animation-delay: .3s; }
@keyframes sp-dot { 0%, 80%, 100% { opacity: .2; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-4px); } }
.sp-action { animation: sp-pop .4s ease-out; }
@keyframes sp-pop { from { transform: scale(.92); opacity: .4; } to { transform: scale(1); opacity: 1; } }
.sp-talk { animation: sp-pop .3s ease-out; }
`;

const styles = {
  page: { maxWidth: '1100px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  setting: { color: '#666', letterSpacing: '1.5px', fontSize: '12px', marginTop: '2px' },
  dot: { width: '28px', height: '8px', borderRadius: '4px', display: 'inline-block' },
  exit: { border: '2px solid #d2d9d0', background: '#fff', borderRadius: '999px', padding: '6px 14px', cursor: 'pointer' },
  stage: { background: '#f7f5ef', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' },
  sceneImg: { maxHeight: '300px', maxWidth: '100%', objectFit: 'contain', borderRadius: '16px' },
  actionCaption: { marginTop: '8px', fontWeight: 'bold', fontSize: '18px', color: '#6e42c1' },
  speakers: { display: 'flex', flexDirection: 'column', gap: '14px' },
  speakerRow: { display: 'flex', alignItems: 'flex-start', gap: '16px' },
  avatar: { width: '84px', height: '84px', borderRadius: '50%', flex: '0 0 84px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'contain' },
  name: { fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', color: '#666', margin: '0 0 6px 4px', textTransform: 'uppercase' },
  note: { fontSize: '14px', color: '#8a5a00', marginTop: '6px', fontStyle: 'italic' },
  talk: { background: '#fff8e1', border: '2px solid #ffd77a', borderRadius: '20px', padding: '18px 20px' },
  grownUp: { background: '#fff', borderRadius: '12px', padding: '10px 14px', fontSize: '14px' },
  linkButton: { border: 'none', background: 'none', color: '#6e42c1', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '14px' },
  options: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  option: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', borderRadius: '18px',
    border: '3px solid #d2d9d0', background: '#fff', textAlign: 'left', fontSize: '15px' },
  optionImg: { width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: '12px' },
};
