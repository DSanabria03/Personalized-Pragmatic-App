import { useState } from 'react';
import './App.css';
import Home from './components/Home';
import TherapistLogin from './components/TherapistLogin';
import TherapistRegister from './components/TherapistRegister';
import AddChild from './components/AddChild';
import ChildCode from './components/ChildCode';
import ChildLogin from './components/ChildLogin';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');

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
      }
    } catch {
      if (action === 'go_login') setCurrentScreen('login');
      else if (action === 'go_home') setCurrentScreen('home');
      else if (action === 'go_register') setCurrentScreen('register');
      else if (action === 'go_child_login') setCurrentScreen('child-login');
      else if (action === 'go_add_child') setCurrentScreen('add-child');
      else if (action === 'go_child_code') setCurrentScreen('child-code');
    }
  };

  return (
    <div className="app-container">
      {currentScreen === 'home' && <Home onNavigate={changeScreen} />}
      {currentScreen === 'login' && <TherapistLogin onNavigate={changeScreen} setCurrentScreen={setCurrentScreen} />}
      {currentScreen === 'register' && <TherapistRegister onNavigate={changeScreen} />}
      {currentScreen === 'add-child' && <AddChild onNavigate={changeScreen} />}
      {currentScreen === 'child-code' && <ChildCode onNavigate={changeScreen} />}
      {currentScreen === 'child-login' && <ChildLogin onNavigate={changeScreen} />}

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