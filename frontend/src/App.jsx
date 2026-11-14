import { useState } from 'react';
import './App.css';

import Home from './components/Home';
import TherapistLogin from './components/TherapistLogin';
import TherapistRegister from './components/TherapistRegister';
import AddChild from './components/AddChild';
import ChildCode from './components/ChildCode';
import ChildLogin from './components/ChildLogin';
import ChildSetup from './components/ChildSetup';
import ChildHome from './components/ChildHome';
import TherapistOverview from './components/TherapistOverview';
import TherapistChildren from './components/TherapistChildren';
import ChildProfile from './components/ChildProfile';
import TherapistActivities from './components/TherapistActivities';
import { INITIAL_CHILDREN, getPip } from './data/mockData';

// Si el backend no responde, navegamos igualmente con esta tabla
const FALLBACK = {
  go_home: 'home',
  go_login: 'login',
  go_register: 'register',
  go_child_login: 'child-login',
  go_add_child: 'add-child',
  go_child_code: 'child-code',
  go_child_setup: 'child-setup',
  go_child_home: 'child-home',
  go_overview: 'therapist-overview',
  go_children: 'therapist-children',
  go_child_profile: 'therapist-child-profile',
  go_activities: 'therapist-activities',
  go_logout: 'home',
};

// Pantallas del panel del terapeuta (sin footer, tienen barra lateral)
const DASHBOARD_SCREENS = ['therapist-overview', 'therapist-children', 'therapist-child-profile', 'therapist-activities'];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');

  // Datos compartidos entre pantallas
  const [kids, setKids] = useState(INITIAL_CHILDREN);
  const [selectedChildId, setSelectedChildId] = useState('dan');
  const [childProfile, setChildProfile] = useState({ nickname: 'Dan', pip: 'milo' });

  // Niño que ha iniciado sesión con el código (por ahora siempre Dan, código PIP742)
  const loggedChildId = 'dan';

  const changeScreen = async (action) => {
    try {
      const response = await fetch('http://localhost:8000/api/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_screen: currentScreen, action }),
      });
      const data = await response.json();
      if (response.ok && data.next_screen) {
        setCurrentScreen(data.next_screen);
        window.scrollTo(0, 0);
      } else {
        console.error(`Invalid transition: ${currentScreen} -> ${action}`);
      }
    } catch {
      if (FALLBACK[action]) setCurrentScreen(FALLBACK[action]);
    }
  };

  const updateChild = (id, changes) => {
    setKids((prev) => prev.map((k) => (k.id === id ? { ...k, ...changes } : k)));
  };

  // Cuando el niño elige su Pip: se guarda y pasa a ser su avatar en el panel del terapeuta
  const handleChildSetup = ({ nickname, pip }) => {
    setChildProfile({ nickname, pip });
    const chosen = getPip(pip);
    updateChild(loggedChildId, { pip, avatar: chosen?.img, color: chosen?.color });
  };

  const openChild = (id) => {
    setSelectedChildId(id);
    changeScreen('go_child_profile');
  };

  const isDashboard = DASHBOARD_SCREENS.includes(currentScreen);

  return (
    <div className="app-container">
      {currentScreen === 'home' && <Home onNavigate={changeScreen} />}
      {currentScreen === 'login' && <TherapistLogin onNavigate={changeScreen} setCurrentScreen={setCurrentScreen} />}
      {currentScreen === 'register' && <TherapistRegister onNavigate={changeScreen} />}
      {currentScreen === 'add-child' && <AddChild onNavigate={changeScreen} />}
      {currentScreen === 'child-code' && <ChildCode onNavigate={changeScreen} />}
      {currentScreen === 'child-login' && <ChildLogin onNavigate={changeScreen} />}
      {currentScreen === 'child-setup' && <ChildSetup onNavigate={changeScreen} onComplete={handleChildSetup} initialName={childProfile.nickname} initialPip={childProfile.pip} />}
      {currentScreen === 'child-home' && <ChildHome onNavigate={changeScreen} childName={childProfile.nickname} />}

      {currentScreen === 'therapist-overview' && (
        <TherapistOverview onNavigate={changeScreen} kids={kids} updateChild={updateChild} onOpenChild={openChild} />
      )}
      {currentScreen === 'therapist-children' && (
        <TherapistChildren onNavigate={changeScreen} kids={kids} onOpenChild={openChild} />
      )}
      {currentScreen === 'therapist-child-profile' && (
        <ChildProfile onNavigate={changeScreen} kids={kids} selectedChildId={selectedChildId} setSelectedChildId={setSelectedChildId} />
      )}
      {currentScreen === 'therapist-activities' && <TherapistActivities onNavigate={changeScreen} />}

      {!isDashboard && (
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
