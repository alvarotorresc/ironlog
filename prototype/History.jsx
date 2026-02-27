/**
 * Prototipo: History
 * Producto: IronLog
 * Fecha: 2026-02-27
 *
 * NOTA: Esto es un prototipo visual, no codigo de produccion.
 *
 * Lista de entrenos pasados agrupados por fecha.
 * Cada entrada muestra: fecha, rutina, duracion, ejercicios, volumen.
 * Tappable para ver detalle del workout.
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
    brandRed: '#F43F5E',
    themeSlate: '#64748B',
    success: '#22C55E',
  },
  fonts: {
    sans: "'Geist Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'Geist Mono', 'SF Mono', monospace",
  },
  radius: { sm: 6, md: 8, lg: 12, xl: 16 },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 },
};

// --- Mock Data ---
const history = [
  {
    section: 'This Week',
    workouts: [
      {
        id: 1,
        date: 'Today',
        time: '14:35',
        routine: 'Push Day',
        duration: '52 min',
        exercises: 5,
        volume: 5240,
        hasPR: true,
      },
      {
        id: 2,
        date: 'Yesterday',
        time: '17:10',
        routine: 'Pull Day',
        duration: '48 min',
        exercises: 5,
        volume: 4890,
        hasPR: true,
      },
      {
        id: 3,
        date: 'Mon, Feb 24',
        time: '16:00',
        routine: 'Leg Day',
        duration: '55 min',
        exercises: 6,
        volume: 7320,
        hasPR: false,
      },
      {
        id: 4,
        date: 'Sun, Feb 23',
        time: '10:30',
        routine: 'Push Day',
        duration: '45 min',
        exercises: 5,
        volume: 4780,
        hasPR: false,
      },
    ],
  },
  {
    section: 'Last Week',
    workouts: [
      {
        id: 5,
        date: 'Fri, Feb 21',
        time: '17:30',
        routine: 'Pull Day',
        duration: '50 min',
        exercises: 5,
        volume: 4560,
        hasPR: false,
      },
      {
        id: 6,
        date: 'Wed, Feb 19',
        time: '16:15',
        routine: 'Push Day',
        duration: '47 min',
        exercises: 5,
        volume: 4320,
        hasPR: true,
      },
      {
        id: 7,
        date: 'Mon, Feb 17',
        time: '17:00',
        routine: 'Leg Day',
        duration: '58 min',
        exercises: 6,
        volume: 6980,
        hasPR: false,
      },
    ],
  },
];

// --- Components ---

function ScreenHeader() {
  return (
    <div style={{
      padding: `${t.space[4]}px ${t.space[5]}px ${t.space[3]}px`,
    }}>
      <h1 style={{
        fontSize: 28,
        fontWeight: 700,
        fontFamily: t.fonts.sans,
        color: t.colors.textPrimary,
        margin: 0,
        letterSpacing: '-0.02em',
      }}>
        History
      </h1>
    </div>
  );
}

/* Tarjeta de workout pasado */
function WorkoutCard({ workout: w }) {
  return (
    <div style={{
      backgroundColor: t.colors.bgSecondary,
      border: `1px solid ${t.colors.border}`,
      borderRadius: t.radius.lg,
      padding: t.space[4],
      cursor: 'pointer',
    }}>
      {/* Fila superior: fecha + duracion */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: t.space[2],
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: t.space[2],
          }}>
            <span style={{
              fontSize: 16,
              fontWeight: 600,
              fontFamily: t.fonts.sans,
              color: t.colors.textPrimary,
            }}>
              {w.routine}
            </span>
            {w.hasPR && (
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                fontFamily: t.fonts.sans,
                color: t.colors.brandRed,
                backgroundColor: 'rgba(244, 63, 94, 0.15)',
                padding: `1px ${t.space[1] + 2}px`,
                borderRadius: t.radius.sm,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                PR
              </span>
            )}
          </div>
          <div style={{
            fontSize: 13,
            fontFamily: t.fonts.sans,
            color: t.colors.textSecondary,
            marginTop: 2,
          }}>
            {w.date} · {w.time}
          </div>
        </div>
        {/* Chevron */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginTop: 4 }}>
          <path d="M9 6l6 6-6 6" stroke={t.colors.textTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'flex',
        gap: t.space[4],
        paddingTop: t.space[2],
        borderTop: `1px solid ${t.colors.border}`,
      }}>
        <div>
          <div style={{
            fontSize: 11, fontFamily: t.fonts.sans,
            color: t.colors.textTertiary, textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Duration
          </div>
          <div style={{
            fontSize: 15, fontWeight: 600, fontFamily: t.fonts.mono,
            color: t.colors.textPrimary, marginTop: 2,
          }}>
            {w.duration}
          </div>
        </div>
        <div>
          <div style={{
            fontSize: 11, fontFamily: t.fonts.sans,
            color: t.colors.textTertiary, textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Exercises
          </div>
          <div style={{
            fontSize: 15, fontWeight: 600, fontFamily: t.fonts.mono,
            color: t.colors.textPrimary, marginTop: 2,
          }}>
            {w.exercises}
          </div>
        </div>
        <div>
          <div style={{
            fontSize: 11, fontFamily: t.fonts.sans,
            color: t.colors.textTertiary, textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Volume
          </div>
          <div style={{
            fontSize: 15, fontWeight: 600, fontFamily: t.fonts.mono,
            color: t.colors.brandBlue, marginTop: 2,
          }}>
            {(w.volume / 1000).toFixed(1)}t
          </div>
        </div>
      </div>
    </div>
  );
}

/* Seccion agrupada por periodo */
function HistorySection({ section }) {
  return (
    <div style={{ marginBottom: t.space[6] }}>
      <div style={{
        padding: `0 ${t.space[5]}px`,
        marginBottom: t.space[3],
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          fontFamily: t.fonts.sans,
          color: t.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {section.section}
        </span>
      </div>
      <div style={{
        padding: `0 ${t.space[5]}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: t.space[3],
      }}>
        {section.workouts.map((w) => (
          <WorkoutCard key={w.id} workout={w} />
        ))}
      </div>
    </div>
  );
}

/* Tab bar */
function TabBar() {
  const tabs = [
    { name: 'Home', icon: '🏠', active: false },
    { name: 'Exercises', icon: '🏋️', active: false },
    { name: 'Routines', icon: '📋', active: false },
    { name: 'History', icon: '🕐', active: true },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: t.colors.bgSecondary,
      borderTop: `1px solid ${t.colors.border}`,
      display: 'flex',
      justifyContent: 'space-around',
      padding: `${t.space[2]}px 0 ${t.space[6]}px`,
    }}>
      {tabs.map((tab) => (
        <div key={tab.name} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          cursor: 'pointer',
          opacity: tab.active ? 1 : 0.5,
        }}>
          <span style={{ fontSize: 20 }}>{tab.icon}</span>
          <span style={{
            fontSize: 11,
            fontWeight: tab.active ? 600 : 400,
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
export default function HistoryPrototype() {
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
      {history.map((section, i) => (
        <HistorySection key={i} section={section} />
      ))}
      <TabBar />
    </div>
  );
}
