import { useState } from 'react';
import './App.css';
import Home from './components/Home';
import TherapistLogin from './components/TherapistLogin';
import TherapistRegister from './components/TherapistRegister';
import AddChild from './components/AddChild';
import ChildCode from './components/ChildCode';
import ChildLogin from './components/ChildLogin';
import StoryPlay from './components/StoryPlay';

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
      else if (action === 'go_story') setCurrentScreen('story');
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
      {currentScreen === 'story' && (
        // TODO: childName / childCode come from the database once MySQL is connected.
        // Add ?lang=it to the address to play in Italian.
        <StoryPlay
          storyId="the_secret_message"
          language={new URLSearchParams(window.location.search).get('lang') === 'it' ? 'it' : 'en'}
          childName="Dan"
          childCode="PIP742"
          onExit={() => setCurrentScreen('home')}
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