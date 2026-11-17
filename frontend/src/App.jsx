import { useState } from 'react';
import './App.css';
import Home from './components/Home';
import Login from './components/Login';
import TherapistRegister from './components/TherapistRegister';
import AddChild from './components/AddChild';
import ChildCode from './components/ChildCode';
import ChildLogin from './components/ChildLogin';
import ChildSetup from './components/ChildSetup';
import ChildHome from './components/ChildHome';
import ChildProfile from './components/ChildProfile';
import TherapistChildren from './components/TherapistChildren';
import TherapistOverview from './components/TherapistOverview';
import TherapistActivities from './components/TherapistActivities';
import StoryPlay from './components/StoryPlay';
import { getPip, INITIAL_CHILDREN } from './data/mockData';

const SCREEN_BY_ACTION = {
  go_home: 'home',
  go_login: 'login',
  go_register: 'register',
  go_add_child: 'add-child',
  go_child_code: 'child-code',
  go_child_login: 'child-login',
  go_child_setup: 'child-setup',
  go_child_home: 'child-home',
  go_story: 'story',
  go_overview: 'overview',
  go_children: 'children',
  go_child_profile: 'child-profile',
  go_activities: 'activities',
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [child, setChild] = useState(null);
  const [kids, setKids] = useState(INITIAL_CHILDREN);
  const [selectedChildId, setSelectedChildId] = useState(INITIAL_CHILDREN[0]?.id);

  const changeScreen = (action) => {
    if (action === 'go_logout') {
      setCurrentScreen('login');
      return;
    }
    const nextScreen = SCREEN_BY_ACTION[action];
    if (nextScreen) setCurrentScreen(nextScreen);
  };

  const updateChild = (childId, updates) => {
    setKids((currentKids) =>
      currentKids.map((item) => (item.id === childId ? { ...item, ...updates } : item)),
    );
  };

  return (
    <div className="app-container">
      {currentScreen === 'home' && <Home onNavigate={changeScreen} />}
      {currentScreen === 'login' && (
        <Login onNavigate={changeScreen} onLogin={() => setCurrentScreen('overview')} />
      )}
      {currentScreen === 'register' && <TherapistRegister onNavigate={changeScreen} />}
      {currentScreen === 'add-child' && <AddChild onNavigate={changeScreen} />}
      {currentScreen === 'child-code' && <ChildCode onNavigate={changeScreen} />}
      {currentScreen === 'child-login' && (
        <ChildLogin
          onNavigate={changeScreen}
          onChildLogin={(childProfile) => {
            setChild(childProfile);
            setCurrentScreen('child-setup');
          }}
        />
      )}
      {currentScreen === 'child-setup' && (
        <ChildSetup
          initialName={child?.name}
          initialPip={child?.pip}
          onNavigate={changeScreen}
          onComplete={(selection) => setChild((currentChild) => ({ ...currentChild, ...selection }))}
        />
      )}
      {currentScreen === 'child-home' && (
        <ChildHome
          childName={child?.nickname || child?.name}
          pip={getPip(child?.pip)}
          onNavigate={changeScreen}
        />
      )}
      {currentScreen === 'overview' && (
        <TherapistOverview
          onNavigate={changeScreen}
          kids={kids}
          updateChild={updateChild}
          onOpenChild={(childId) => {
            setSelectedChildId(childId);
            setCurrentScreen('child-profile');
          }}
        />
      )}
      {currentScreen === 'children' && (
        <TherapistChildren
          onNavigate={changeScreen}
          kids={kids}
          onOpenChild={(childId) => {
            setSelectedChildId(childId);
            setCurrentScreen('child-profile');
          }}
        />
      )}
      {currentScreen === 'child-profile' && (
        <ChildProfile
          onNavigate={changeScreen}
          kids={kids}
          selectedChildId={selectedChildId}
          setSelectedChildId={setSelectedChildId}
        />
      )}
      {currentScreen === 'activities' && <TherapistActivities onNavigate={changeScreen} />}
      {currentScreen === 'story' && (
        <StoryPlay
          storyId="the_secret_message"
          language={new URLSearchParams(window.location.search).get('lang') === 'it' ? 'it' : 'en'}
          childName={child?.nickname || child?.name || 'Dan'}
          childCode={child?.code || null}
          pipName={getPip(child?.pip)?.name || 'Pip'}
          pipIdle={getPip(child?.pip)?.img}
          pipTalking={getPip(child?.pip)?.img}
          onExit={() => setCurrentScreen('child-home')}
        />
      )}

      <footer className="footer">
        <p>Little steps, big things.</p>
        <div className="footer-links">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
        </div>
      </footer>
    </div>
  );
}