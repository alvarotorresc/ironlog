import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import Home from './Home.jsx';
import Exercises from './Exercises.jsx';
import Routines from './Routines.jsx';
import WorkoutTracking from './WorkoutTracking.jsx';
import ExerciseDetail from './ExerciseDetail.jsx';
import History from './History.jsx';

const screens = [
  { name: 'Home', component: Home },
  { name: 'Exercises', component: Exercises },
  { name: 'Routines', component: Routines },
  { name: 'Workout', component: WorkoutTracking },
  { name: 'Exercise Detail', component: ExerciseDetail },
  { name: 'History', component: History },
];

function App() {
  const [activeScreen, setActiveScreen] = useState(0);
  const Screen = screens[activeScreen].component;

  return (
    <div>
      {/* Screen selector bar — solo para el prototipo */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: '#1A1A1A',
        borderBottom: '1px solid #2E2E2E',
        display: 'flex',
        gap: 4,
        padding: '8px 12px',
        overflowX: 'auto',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}>
        <span style={{
          color: '#525252',
          fontSize: 11,
          fontWeight: 600,
          padding: '4px 8px',
          whiteSpace: 'nowrap',
          alignSelf: 'center',
        }}>
          PROTOTYPE
        </span>
        {screens.map((s, i) => (
          <button
            key={s.name}
            onClick={() => setActiveScreen(i)}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: i === activeScreen ? '#3291FF' : '#2E2E2E',
              color: i === activeScreen ? '#FFFFFF' : '#A3A3A3',
              fontSize: 12,
              fontWeight: i === activeScreen ? 600 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {s.name}
          </button>
        ))}
      </div>
      {/* Spacer para la barra del prototipo */}
      <div style={{ height: 44 }} />
      <Screen />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
