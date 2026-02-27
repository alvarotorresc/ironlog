/**
 * Prototipo: Home / Stats Dashboard
 * Producto: IronLog
 * Fecha: 2026-02-27
 *
 * NOTA: Esto es un prototipo visual, no codigo de produccion.
 * Su proposito es validar la direccion visual con el usuario.
 *
 * Pantalla principal: dashboard de stats + boton "Start Workout".
 * Inspiracion: Hevy home (resumen rapido) + Apple Fitness (numeros bold).
 * Los numeros son el protagonista — el usuario abre la app y ve su progreso de un vistazo.
 */

// --- Design Tokens ---
const t = {
  colors: {
    bgPrimary: '#0A0A0A',
    bgSecondary: '#111111',
    bgTertiary: '#1A1A1A',
    bgElevated: '#1F1F1F',
    border: '#2E2E2E',
    textPrimary: '#EDEDED',
    textSecondary: '#A3A3A3',
    textTertiary: '#525252',
    brandBlue: '#3291FF',
    brandRed: '#F43F5E',
    themeSlate: '#64748B',
    themeSlateBright: '#94A3B8',
    success: '#22C55E',
    warning: '#F59E0B',
  },
  fonts: {
    sans: "'Geist Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'Geist Mono', 'SF Mono', 'Fira Code', monospace",
  },
  radius: { sm: 6, md: 8, lg: 12, xl: 16 },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 },
};

// --- Mock Data ---
const stats = {
  workoutsThisWeek: 4,
  currentStreak: 12,
  volumeThisWeek: 24750,
  volumeThisMonth: 87300,
  recentPRs: [
    { exercise: 'Bench Press', weight: 95, date: 'Hoy' },
    { exercise: 'Squat', weight: 140, date: 'Ayer' },
    { exercise: 'Deadlift', weight: 170, date: 'Hace 3 dias' },
  ],
};

const routines = [
  { id: 1, name: 'Push Day', exercises: 5, lastUsed: 'Hoy' },
  { id: 2, name: 'Pull Day', exercises: 5, lastUsed: 'Ayer' },
  { id: 3, name: 'Leg Day', exercises: 6, lastUsed: 'Hace 2 dias' },
];

// --- Components ---

function StatusBar() {
  return (
    <div style={{
      height: 44,
      backgroundColor: t.colors.bgPrimary,
    }} />
  );
}

/* Header minimalista: logo + titulo */
function Header() {
  return (
    <div style={{
      padding: `${t.space[4]}px ${t.space[5]}px`,
      display: 'flex',
      alignItems: 'center',
      gap: t.space[3],
    }}>
      {/* Logo simplificado inline */}
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <rect x="14" y="4" width="4" height="24" rx="2" fill={t.colors.textPrimary} />
        <rect x="4" y="8" width="4" height="16" rx="2" fill={t.colors.textPrimary} opacity="0.6" />
        <rect x="9" y="6" width="4" height="20" rx="2" fill={t.colors.textPrimary} opacity="0.8" />
        <rect x="19" y="6" width="4" height="20" rx="2" fill={t.colors.textPrimary} opacity="0.8" />
        <rect x="24" y="8" width="4" height="16" rx="2" fill={t.colors.textPrimary} opacity="0.6" />
      </svg>
      <span style={{
        fontSize: 24,
        fontWeight: 700,
        fontFamily: t.fonts.sans,
        color: t.colors.textPrimary,
        letterSpacing: '-0.02em',
      }}>
        IronLog
      </span>
    </div>
  );
}

/* Tarjeta de stat individual — numeros en mono, grandes */
function StatCard({ label, value, unit, color = t.colors.textPrimary, icon }) {
  return (
    <div style={{
      backgroundColor: t.colors.bgSecondary,
      border: `1px solid ${t.colors.border}`,
      borderRadius: t.radius.lg,
      padding: t.space[4],
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{
        fontSize: 12,
        fontWeight: 500,
        fontFamily: t.fonts.sans,
        color: t.colors.textSecondary,
        marginBottom: t.space[2],
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        display: 'flex',
        alignItems: 'center',
        gap: t.space[1],
      }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        {/* Numero grande en mono — el protagonista */}
        <span style={{
          fontSize: 32,
          fontWeight: 700,
          fontFamily: t.fonts.mono,
          color,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {value}
        </span>
        {unit && (
          <span style={{
            fontSize: 14,
            fontWeight: 500,
            fontFamily: t.fonts.sans,
            color: t.colors.textTertiary,
          }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

/* Grid de stats principales — 2 columnas */
function StatsGrid() {
  return (
    <div style={{ padding: `0 ${t.space[5]}px` }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: t.space[3],
      }}>
        <StatCard
          icon="📅"
          label="This week"
          value={stats.workoutsThisWeek}
          unit="workouts"
          color={t.colors.brandBlue}
        />
        <StatCard
          icon="🔥"
          label="Streak"
          value={stats.currentStreak}
          unit="days"
          color={t.colors.success}
        />
        <StatCard
          icon="🏋️"
          label="Volume (week)"
          value={(stats.volumeThisWeek / 1000).toFixed(1)}
          unit="t"
        />
        <StatCard
          icon="📊"
          label="Volume (month)"
          value={(stats.volumeThisMonth / 1000).toFixed(1)}
          unit="t"
        />
      </div>
    </div>
  );
}

/* Boton grande de "Start Workout" — CTA principal, centro de la pantalla */
function StartWorkoutButton() {
  return (
    <div style={{ padding: `${t.space[6]}px ${t.space[5]}px` }}>
      <button style={{
        width: '100%',
        height: 56,
        backgroundColor: t.colors.brandBlue,
        border: 'none',
        borderRadius: t.radius.lg,
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 700,
        fontFamily: t.fonts.sans,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: t.space[2],
        letterSpacing: '-0.01em',
      }}>
        <span style={{ fontSize: 22 }}>+</span>
        Start Workout
      </button>
    </div>
  );
}

/* PR reciente — fila con ejercicio, peso, fecha */
function PRRow({ pr }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `${t.space[3]}px 0`,
      borderBottom: `1px solid ${t.colors.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: t.space[3] }}>
        {/* Badge de PR */}
        <div style={{
          backgroundColor: 'rgba(244, 63, 94, 0.15)',
          color: t.colors.brandRed,
          fontSize: 11,
          fontWeight: 700,
          fontFamily: t.fonts.sans,
          padding: `2px ${t.space[2]}px`,
          borderRadius: t.radius.sm,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          PR
        </div>
        <span style={{
          fontSize: 15,
          fontWeight: 500,
          fontFamily: t.fonts.sans,
          color: t.colors.textPrimary,
        }}>
          {pr.exercise}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontSize: 18,
          fontWeight: 700,
          fontFamily: t.fonts.mono,
          color: t.colors.brandRed,
        }}>
          {pr.weight}
        </span>
        <span style={{
          fontSize: 12,
          fontFamily: t.fonts.sans,
          color: t.colors.textTertiary,
        }}>
          kg
        </span>
        <span style={{
          fontSize: 12,
          fontFamily: t.fonts.sans,
          color: t.colors.textTertiary,
          marginLeft: t.space[2],
        }}>
          {pr.date}
        </span>
      </div>
    </div>
  );
}

/* Seccion de PRs recientes */
function RecentPRs() {
  return (
    <div style={{ padding: `0 ${t.space[5]}px` }}>
      <h3 style={{
        fontSize: 18,
        fontWeight: 600,
        fontFamily: t.fonts.sans,
        color: t.colors.textPrimary,
        marginBottom: t.space[3],
        marginTop: 0,
      }}>
        Recent PRs
      </h3>
      <div style={{
        backgroundColor: t.colors.bgSecondary,
        border: `1px solid ${t.colors.border}`,
        borderRadius: t.radius.lg,
        padding: `${t.space[1]}px ${t.space[4]}px`,
      }}>
        {stats.recentPRs.map((pr, i) => (
          <PRRow key={i} pr={pr} />
        ))}
      </div>
    </div>
  );
}

/* Quick-start routines — acceso rapido desde home */
function QuickRoutines() {
  return (
    <div style={{ padding: `${t.space[6]}px ${t.space[5]}px 0` }}>
      <h3 style={{
        fontSize: 18,
        fontWeight: 600,
        fontFamily: t.fonts.sans,
        color: t.colors.textPrimary,
        marginBottom: t.space[3],
        marginTop: 0,
      }}>
        Quick Start
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: t.space[2] }}>
        {routines.map((r) => (
          <div key={r.id} style={{
            backgroundColor: t.colors.bgSecondary,
            border: `1px solid ${t.colors.border}`,
            borderRadius: t.radius.lg,
            padding: `${t.space[3]}px ${t.space[4]}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}>
            <div>
              <div style={{
                fontSize: 15,
                fontWeight: 600,
                fontFamily: t.fonts.sans,
                color: t.colors.textPrimary,
              }}>
                {r.name}
              </div>
              <div style={{
                fontSize: 13,
                fontFamily: t.fonts.sans,
                color: t.colors.textSecondary,
                marginTop: 2,
              }}>
                {r.exercises} exercises · {r.lastUsed}
              </div>
            </div>
            {/* Play button */}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: t.radius.md,
              backgroundColor: t.colors.bgTertiary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: t.colors.brandBlue,
              fontSize: 18,
            }}>
              ▶
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Tab bar inferior */
function TabBar() {
  const tabs = [
    { name: 'Home', icon: '🏠', active: true },
    { name: 'Exercises', icon: '🏋️', active: false },
    { name: 'Routines', icon: '📋', active: false },
    { name: 'History', icon: '🕐', active: false },
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
      /* padding bottom extra para safe area del movil */
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
export default function HomePrototype() {
  return (
    <div style={{
      fontFamily: t.fonts.sans,
      backgroundColor: t.colors.bgPrimary,
      color: t.colors.textPrimary,
      minHeight: '100vh',
      maxWidth: 430,
      margin: '0 auto',
      paddingBottom: 100,
      /* 430px = ancho maximo tipico de movil grande */
    }}>
      <StatusBar />
      <Header />
      <StatsGrid />
      <StartWorkoutButton />
      <RecentPRs />
      <QuickRoutines />
      <TabBar />
    </div>
  );
}
