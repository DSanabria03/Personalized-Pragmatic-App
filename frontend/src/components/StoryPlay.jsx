import { useCallback, useEffect, useRef, useState } from 'react';

// Play screen for one story: Pip narrates, the child picks a picture, Pip reacts.
// Usage in App.jsx:
//   {currentScreen === 'story' && (
//     <StoryPlay storyId="the_secret_message" language="en" pipName="Pip" childName="Dan"
//       pipIdle="/resources/pip_idle.gif" pipTalking="/resources/pip_talking.gif"
//       onExit={() => setCurrentScreen('home')} />
//   )}

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function post(path, body) {
  const response = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${path} failed: ${response.status}`);
  return response.json();
}

export default function StoryPlay({
  storyId = 'the_secret_message',
  language = 'en',
  pipName = 'Pip',
  pipIdle = '/resources/pip_idle.gif',
  pipTalking = '/resources/pip_talking.gif',
  childCode = null,
  childName = null,   // e.g. 'Dan' - Pip uses it when talking to the child
  onExit,
}) {
  const [story, setStory] = useState(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  // phase: loading -> narrating -> choosing -> waiting -> feedback -> (next scene) ... -> finished
  const [phase, setPhase] = useState('loading');
  const [bubble, setBubble] = useState('');          // what Pip is saying (shown as text too)
  const [quote, setQuote] = useState(null);          // { speaker, listener, text }
  const [talking, setTalking] = useState(false);     // switches the GIF
  const [attempt, setAttempt] = useState(1);
  const [tried, setTried] = useState([]);            // option ids already picked in this scene
  const [revealed, setRevealed] = useState(null);    // correct option id once the scene is done
  const [solved, setSolved] = useState([]);
  const [error, setError] = useState('');
  const [finishedTalking, setFinishedTalking] = useState(false);
  const cancelled = useRef(false);

  // Read text aloud with the browser's built-in voice; the "talking" GIF plays meanwhile.
  // showInBubble=false: speak without replacing Pip's speech bubble (used for the customer's sentence).
  const speak = useCallback(
    (text, showInBubble = true) =>
      new Promise((resolve) => {
        if (showInBubble) setBubble(text);
        if (!('speechSynthesis' in window) || !text) {
          resolve();
          return;
        }
        let finished = false;
        const done = () => {
          if (finished) return;
          finished = true;
          setTalking(false);
          resolve();
        };
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'it' ? 'it-IT' : 'en-US';
        utterance.rate = 0.95;
        utterance.onstart = () => setTalking(true);
        utterance.onend = done;
        utterance.onerror = done;
        setTalking(true);
        window.speechSynthesis.speak(utterance);
        // Safety net: some browsers never fire "onend", so continue after roughly the speaking time.
        setTimeout(done, 2000 + text.length * 80);
      }),
    [language],
  );

  const playScene = useCallback(
    async (loadedStory, index) => {
      const scene = loadedStory.scenes[index];
      setSceneIndex(index);
      setAttempt(1);
      setTried([]);
      setRevealed(null);
      setQuote(null);
      setPhase('narrating');
      setBubble('…');
      try {
        const data = await post(`/api/stories/${storyId}/narrate`, {
          scene_id: scene.id, language, pip_name: pipName, child_name: childName,
        });
        if (cancelled.current) return;
        await speak(data.narration);
        setQuote({ speaker: data.speaker, listener: data.listener, text: data.quote });
        await speak(data.quote, false);   // the customer's exact sentence from the story file
        if (!cancelled.current) setPhase('choosing');
      } catch (e) {
        setError(String(e));
      }
    },
    [storyId, language, pipName, childName, speak],
  );

  // Load the story and start the first scene.
  useEffect(() => {
    let ignore = false;   // React dev mode runs effects twice; only the last run may start the story
    cancelled.current = false;
    fetch(`${API}/api/stories/${storyId}?language=${language}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Story '${storyId}' could not be loaded (${r.status})`);
        return r.json();
      })
      .then((data) => {
        if (ignore) return;
        setStory(data);
        playScene(data, 0);
      })
      .catch((e) => !ignore && setError(String(e)));
    return () => {
      ignore = true;
      cancelled.current = true;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [storyId, language, playScene]);

  const choose = async (optionId) => {
    if (phase !== 'choosing') return;
    const scene = story.scenes[sceneIndex];
    setPhase('waiting');
    setTried((t) => [...t, optionId]);
    setBubble('…');
    try {
      const result = await post(`/api/stories/${storyId}/answer`, {
        scene_id: scene.id, child_answer: optionId, attempt, language, pip_name: pipName, child_code: childCode, child_name: childName,
      });
      if (result.scene_done) {
        setRevealed(result.correct_answer);
        if (result.is_correct) setSolved((s) => [...s, scene.id]);
      }
      await speak(result.speech);
      if (result.scene_done) {
        setPhase('feedback');
      } else {
        setAttempt((a) => a + 1);
        setPhase('choosing');
      }
    } catch (e) {
      setError(String(e));
    }
  };

  const next = async () => {
    if (sceneIndex + 1 < story.scenes.length) {
      playScene(story, sceneIndex + 1);
    } else {
      setPhase('finished');
      setQuote(null);
      setBubble('…');
      const data = await post(`/api/stories/${storyId}/finish`, {
        language, pip_name: pipName, child_name: childName, solved_scene_ids: solved,
      }).catch(() => ({ speech: '' }));
      await speak(data.speech);
      setFinishedTalking(true);
    }
  };

  if (error) {
    return (
      <main style={styles.page}>
        <p>Something went wrong: {error}</p>
        <p>Is the backend running on {API}?</p>
        <button type="button" onClick={onExit}>Back</button>
      </main>
    );
  }
  if (!story) return <main style={styles.page}><p>Loading story…</p></main>;

  const scene = story.scenes[sceneIndex];

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <span style={{ fontWeight: 'bold' }}>{story.title}</span>
        <span style={{ color: '#666', letterSpacing: '1.5px', fontSize: '12px' }}>{story.setting.toUpperCase()}</span>
        <span>{Math.min(sceneIndex + 1, story.scenes.length)} / {story.scenes.length}</span>
        <button type="button" onClick={onExit}>Exit</button>
      </header>

      <section style={styles.stage}>
        {scene.image && phase !== 'finished' && <img src={scene.image} alt="" style={styles.sceneImg} />}

        <div style={styles.pipRow}>
          <img src={talking ? pipTalking : pipIdle} alt={pipName} style={styles.pip}
            onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
          <div style={styles.bubble}>{bubble}</div>
        </div>

        {quote && phase !== 'finished' && (
          <p style={styles.quote}>
            <strong>{quote.speaker}</strong>{quote.listener ? ` → ${quote.listener}` : ''}: “{quote.text}”
          </p>
        )}
      </section>

      {(phase === 'choosing' || phase === 'waiting' || phase === 'feedback') && (
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

      {phase === 'feedback' && !talking && (
        <button type="button" className="register-submit" onClick={next}>Continue →</button>
      )}
      {phase === 'finished' && finishedTalking && (
        <button type="button" className="register-submit" onClick={onExit}>Back home</button>
      )}
    </main>
  );
}

const styles = {
  page: { maxWidth: '1100px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' },
  stage: { background: '#f7f5ef', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  sceneImg: { maxHeight: '320px', objectFit: 'contain', alignSelf: 'center' },
  pipRow: { display: 'flex', alignItems: 'center', gap: '16px' },
  pip: { width: '120px', height: '120px', objectFit: 'contain' },
  bubble: { background: '#fff', borderRadius: '18px', padding: '16px 20px', fontSize: '18px', flex: 1, minHeight: '56px' },
  quote: { fontSize: '22px', textAlign: 'center' },
  options: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  option: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', borderRadius: '18px',
    border: '3px solid #d2d9d0', background: '#fff', cursor: 'pointer', textAlign: 'left', fontSize: '15px' },
  optionImg: { width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: '12px' },
};
