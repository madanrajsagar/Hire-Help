import { useState } from 'react';
import { AppExperience } from './components/AppExperience';
import { LandingPage } from './components/LandingPage';
import './App.css';

function App() {
  const [showApp, setShowApp] = useState(false);

  return showApp ? (
    <AppExperience onBackToLanding={() => setShowApp(false)} />
  ) : (
    <LandingPage onTryForFree={() => setShowApp(true)} />
  );
}

export default App;