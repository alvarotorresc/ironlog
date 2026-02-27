/**
 * Prototipo: Routines
 * Producto: IronLog
 * Fecha: 2026-02-27
 *
 * NOTA: Esto es un prototipo visual, no codigo de produccion.
 *
 * Lista de rutinas con boton de start rapido.
 * Cada card muestra: nombre, ejercicios con ilustraciones, ultimo uso.
 */

const t = {
  colors: {
    bgPrimary: '#0A0A0A',
    bgSecondary: '#111111',
    bgTertiary: '#1A1A1A',
    border: '#2E2E2E',
    textPrimary: '#EDEDED',
    textSecondary: '#A3A3A3',
    textTertiary: '#525252',
    brandBlue: '#3291FF',
    themeSlate: '#64748B',
    success: '#22C55E',
  },
  fonts: {
    sans: "'Geist Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'Geist Mono', 'SF Mono', monospace",
  },
  radius: { sm: 6, md: 8, lg: 12, xl: 16, full: 9999 },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 },
};

// --- Mock Data ---
const routines = [
  {
    id: 1,
    name: 'Push Day',
    exercises: ['Bench Press', 'Incline Bench Press', 'Overhead Press', 'Lateral Raise', 'Push-ups'],
    lastUsed: 'Today',
    timesUsed: 15,
  },
  {
    id: 2,
    name: 'Pull Day',
    exercises: ['Deadlift', 'Barbell Row', 'Lat Pulldown', 'Pull-ups', 'Barbell Curl'],
    lastUsed: 'Yesterday',
    timesUsed: 14,
  },
  {
    id: 3,
    name: 'Leg Day',
    exercises: ['Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Extension', 'Leg Curl', 'Calf Raise'],
    lastUsed: 'Mon, Feb 24',
    timesUsed: 12,
  },
  {
    id: 4,
    name: 'Core & Cardio',
    exercises: ['Plank', 'Hanging Leg Raise', 'Russian Twist', 'Running', 'Jump Rope'],
    lastUsed: 'Feb 20',
    timesUsed: 5,
  },
];

// --- Components ---

function ScreenHeader() {
  return (
    <div style={{
      padding: `${t.space[4]}px ${t.space[5]}px ${t.space[3]}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <h1 style={{
        fontSize: 28,
        fontWeight: 700,
        fontFamily: t.fonts.sans,
        color: t.colors.textPrimary,
        margin: 0,
        letterSpacing: '-0.02em',
      }}>
        Routines
      </h1>
      <div style={{
        width: 36, height: 36, borderRadius: t.radius.md,
        backgroundColor: t.colors.brandBlue,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: '#FFFFFF', fontSize: 20, fontWeight: 300,
      }}>
        +
      </div>
    </div>
  );
}

/* Mini ilustracion para cada ejercicio en la lista */
function MiniIllustration() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: t.radius.sm,
      backgroundColor: t.colors.bgTertiary,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="5" r="2.5" stroke={t.colors.themeSlate} strokeWidth="1.5" />
        <path d="M12 8v6M8 20l4-6 4 6M7 13h10" stroke={t.colors.themeSlate} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* Tarjeta de rutina completa */
function RoutineCard({ routine }) {
  return (
    <div style={{
      backgroundColor: t.colors.bgSecondary,
      border: `1px solid ${t.colors.border}`,
      borderRadius: t.radius.lg,
      padding: t.space[4],
    }}>
      {/* Header: nombre + start button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: t.space[3],
      }}>
        <div>
          <div style={{
            fontSize: 18, fontWeight: 700, fontFamily: t.fonts.sans,
            color: t.colors.textPrimary, letterSpacing: '-0.01em',
          }}>
            {routine.name}
          </div>
          <div style={{
            fontSize: 13, fontFamily: t.fonts.sans,
            color: t.colors.textSecondary, marginTop: 2,
          }}>
            {routine.exercises.length} exercises · Used {routine.timesUsed}x
          </div>
        </div>
        {/* Big play/start button */}
        <button style={{
          padding: `${t.space[2]}px ${t.space[4]}px`,
          borderRadius: t.radius.md,
          backgroundColor: t.colors.brandBlue,
          border: 'none',
          color: '#FFFFFF',
          fontSize: 14,
          fontWeight: 700,
          fontFamily: t.fonts.sans,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: t.space[1],
        }}>
          <span>▶</span> Start
        </button>
      </div>

      {/* Lista de ejercicios con mini-ilustraciones */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: t.space[2],
        paddingTop: t.space[3],
        borderTop: `1px solid ${t.colors.border}`,
      }}>
        {routine.exercises.map((name, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: t.space[2],
          }}>
            <MiniIllustration />
            <span style={{
              fontSize: 14, fontFamily: t.fonts.sans,
              color: t.colors.textSecondary,
            }}>
              {name}
            </span>
          </div>
        ))}
      </div>

      {/* Footer: ultimo uso */}
      <div style={{
        marginTop: t.space[3],
        paddingTop: t.space[2],
        borderTop: `1px solid ${t.colors.border}`,
        fontSize: 12,
        fontFamily: t.fonts.sans,
        color: t.colors.textTertiary,
      }}>
        Last used: {routine.lastUsed}
      </div>
    </div>
  );
}

/* Tab bar */
function TabBar() {
  const tabs = [
    { name: 'Home', icon: '🏠', active: false },
    { name: 'Exercises', icon: '🏋️', active: false },
    { name: 'Routines', icon: '📋', active: true },
    { name: 'History', icon: '🕐', active: false },
  ];

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      backgroundColor: t.colors.bgSecondary,
      borderTop: `1px solid ${t.colors.border}`,
      display: 'flex', justifyContent: 'space-around',
      padding: `${t.space[2]}px 0 ${t.space[6]}px`,
    }}>
      {tabs.map((tab) => (
        <div key={tab.name} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 2, cursor: 'pointer', opacity: tab.active ? 1 : 0.5,
        }}>
          <span style={{ fontSize: 20 }}>{tab.icon}</span>
          <span style={{
            fontSize: 11, fontWeight: tab.active ? 600 : 400,
            fontFamily: t.fonts.sans,
            color: tab.active ? t.colors.brandBlue : t.colors.textSecondary,
          }}>
            {tab.name}
          </span>
        </div>
      ))}
    </div>
  );
}

// --- Pantalla completa ---
export default function RoutinesPrototype() {
  return (
    <div style={{
      fontFamily: t.fonts.sans,
      backgroundColor: t.colors.bgPrimary,
      color: t.colors.textPrimary,
      minHeight: '100vh',
      maxWidth: 430,
      margin: '0 auto',
      paddingBottom: 100,
    }}>
      <div style={{ height: 44 }} />
      <ScreenHeader />
      <div style={{
        padding: `${t.space[3]}px ${t.space[5]}px`,
        display: 'flex', flexDirection: 'column',
        gap: t.space[3],
      }}>
        {routines.map((r) => (
          <RoutineCard key={r.id} routine={r} />
        ))}
      </div>
      <TabBar />
    </div>
  );
}
