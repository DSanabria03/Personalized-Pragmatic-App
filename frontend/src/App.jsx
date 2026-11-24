import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { api, loadSession, loadSettings, saveSession, saveSettings } from './api';
import AddChild from './components/AddChild';
import ChildCode from './components/ChildCode';
import ChildHome from './components/ChildHome';
import ChildLogin from './components/ChildLogin';
import ChildSetup from './components/ChildSetup';
import Home from './components/Home';
import Settings from './components/Settings';
import StoryDone from './components/StoryDone';
import StoryPlay from './components/StoryPlay';
import TherapistActivities from './components/TherapistActivities';
import TherapistChild from './components/TherapistChild';
import TherapistChildren from './components/TherapistChildren';
import TherapistDashboard from './components/TherapistDashboard';
import TherapistLogin from './components/Login';
import TherapistRegister from './components/TherapistRegister';
import { getPip } from './data/pips';

// Which screen each button ("action") opens.
const ACTIONS = {
  go_home: 'home',
  go_login: 'login',
  go_register: 'register',
  go_child_login: 'child-login',
  go_add_child: 'add-child',
  go_child_code: 'child-code',
  go_story: 'story',
  go_settings: 'settings',
  go_dashboard: 'dashboard',
  go_children: 'children',
  go_analytics: 'child',
  go_activities: 'activities',
  go_child_home: 'child-home',
  go_child_setup: 'child-setup',
};

// Screens that need someone to be logged in.
const NEEDS = {
  dashboard: 'therapist', children: 'therapist', child: 'therapist', activities: 'therapist', 'add-child': 'therapist', 'child-code': 'therapist', 'child-home': 'child', 'child-setup': 'child',
};

// Redesigned screens: their design has no footer. The other screens keep it until they are redesigned.
const NO_FOOTER = [
  'home', 'login', 'register', 'add-child', 'child-code', 'child-login', 'child-setup',
  'dashboard', 'children', 'child', 'activities',
];

function startScreen(session) {
  if (session && session.role === 'child') return 'child-home';
  if (session && session.role === 'therapist') return 'dashboard';
  return 'home';
}

export default function App() {
  const [session, setSession] = useState(loadSession); // { token, role: 'child' | 'therapist', name, practice }
  const [settings, setSettings] = useState(loadSettings); // { language, voice, grownUpPause }
  const [screen, setScreen] = useState(() => startScreen(loadSession()));
  const [previous, setPrevious] = useState('home'); // where "Back" in Settings goes
  const [newChild, setNewChild] = useState(null); // the child just added (for the code screen)
  const [lastResult, setLastResult] = useState(null); // results of the story just played
  const [dashboardChild, setDashboardChild] = useState(null); // the child the therapist's child page shows (none = the first one)
  const [storyBack, setStoryBack] = useState(null); // where the story goes back to (the therapist's "Preview exercise")
  const [storyKey, setStoryKey] = useState(0); // new number = start the story fresh ("Play again")

  // childId: the child to show on the therapist's child page ("Analytics" shows the last one seen).
  const go = (target, childId = null) => {
    if (childId !== null) setDashboardChild(childId);
    if (target === 'settings' && screen !== 'settings') setPrevious(screen);
    setScreen(target);
    window.scrollTo(0, 0);
  };

  const logout = useCallback(() => {
    api('/api/logout', { method: 'POST' }).catch(() => {});
    saveSession(null);
    setSession(null);
    setDashboardChild(null);
    setScreen('home');
  }, []);

  // Is the saved login still valid? (e.g. the code was reset by the therapist)
  // For a child it also brings their nickname and Pip from the database (they may have changed on another computer).
  useEffect(() => {
    if (!loadSession()) return;
    api('/api/me')
      .then((me) => {
        if (me.role !== 'child') return;
        setSession((current) => {
          if (!current || current.role !== 'child') return current;
          const s = { ...current, nickname: me.child.nickname, pip: me.child.pip };
          saveSession(s);
          return s;
        });
      })
      .catch((error) => {
        if (error.status === 401) logout();
      });
  }, [logout]);

  const login = (data, next) => {
    const s = data.role === 'child'
      ? { token: data.token, role: 'child', name: data.child.name, nickname: data.child.nickname, pip: data.child.pip }
      : { token: data.token, role: 'therapist', name: data.therapist.display_name, practice: data.therapist.practice };
    saveSession(s);
    setSession(s);
    go(next || startScreen(s));
  };

  const onNavigate = (action) => {
    let target = ACTIONS[action] || 'home';
    if (target === 'login' && session && session.role === 'therapist') target = 'dashboard';
    if (target === 'child-login' && session && session.role === 'child') target = 'child-home';
    if (target === 'home' && session) target = startScreen(session);
    if (target === 'story') { setStoryKey((k) => k + 1); setStoryBack(null); }
    go(target);
  };

  // "Choose your Pip": the nickname and the Pip are saved in the database (PUT /api/profile).
  // The session keeps a copy so the screens can show them without asking the backend again.
  const updateChildProfile = async ({ nickname, pip }) => {
    const child = await api('/api/profile', { method: 'PUT', body: { nickname, pip: pip || '' } });
    const s = { ...session, nickname: child.nickname, pip: child.pip };
    saveSession(s);
    setSession(s);
  };

  const updateSettings = (next) => {
    saveSettings(next);
    setSettings(next);
  };

  // Not logged in (or the wrong account) for this screen? Then show the right login.
  let shown = screen;
  if (NEEDS[screen] && (!session || session.role !== NEEDS[screen])) shown = NEEDS[screen] === 'child' ? 'child-login' : 'login';

  const childOrHome = session && session.role === 'child' ? 'child-home' : 'home';
  const afterStory = storyBack || childOrHome;

  // What the therapist's pages share.
  const therapistPage = { session, onNavigate, onLogout: logout, onOpenChild: (id) => go('child', id) };

  return (
    <div className="app-container">
      {shown === 'home' && <Home onNavigate={onNavigate} />}
      {shown === 'login' && <TherapistLogin onNavigate={onNavigate} onLogin={(d) => login(d)} />}
      {shown === 'register' && <TherapistRegister onNavigate={onNavigate} onLogin={(d) => login(d, 'add-child')} />}
      {shown === 'add-child' && (
        <AddChild onNavigate={onNavigate}
          therapistName={session && [session.name, session.practice].filter(Boolean).join(' · ')}
          onCreated={(child) => { setNewChild(child); go('child-code'); }} />
      )}
      {shown === 'child-code' && (
        <ChildCode onNavigate={onNavigate} child={newChild} onOpenProfile={() => go('child', newChild?.id ?? null)} />
      )}
      {shown === 'child-login' && <ChildLogin onNavigate={onNavigate} onLogin={(d) => login(d)} />}
      {shown === 'child-setup' && (
        <ChildSetup
          initialName={session.nickname || session.name}
          initialPip={session.pip || null}
          onNavigate={onNavigate}
          onComplete={updateChildProfile}
        />
      )}
      {shown === 'child-home' && <ChildHome session={session} settings={settings} onNavigate={onNavigate} onLogout={logout} />}
      {shown === 'dashboard' && <TherapistDashboard {...therapistPage} />}
      {shown === 'children' && <TherapistChildren {...therapistPage} />}
      {shown === 'child' && <TherapistChild {...therapistPage} childId={dashboardChild} />}
      {shown === 'activities' && (
        <TherapistActivities {...therapistPage}
          onPreview={() => { setStoryKey((k) => k + 1); setStoryBack('activities'); go('story'); }} />
      )}
      {shown === 'settings' && (
        <Settings settings={settings} onChange={updateSettings} onBack={() => go(previous)} session={session} onLogout={logout} />
      )}
      {shown === 'story' && (
        // Language, voice and pause come from Settings and can't change during the story.
        <StoryPlay
          key={storyKey}
          storyId="the_secret_message"
          language={settings.language}
          voice={settings.voice}
          therapistPause={settings.grownUpPause}
          pipName="Pip"
          pipIdle={getPip(session && session.pip)?.img}
          onExit={() => go(afterStory)}
          onFinished={(result) => { setLastResult(result); go('story-done'); }}
        />
      )}
      {shown === 'story-done' && (
        <StoryDone result={lastResult} language={settings.language}
          onHome={() => go(afterStory)}
          onPlayAgain={() => { setStoryKey((k) => k + 1); go('story'); }} />
      )}

      {!NO_FOOTER.includes(shown) && (
        <footer className="footer">
          <p>Little steps, big things.</p>
          <div className="footer-links">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
          </div>
        </footer>
      )}
    </div>
  );
}
