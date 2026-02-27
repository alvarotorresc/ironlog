/**
 * Prototipo: Exercises List
 * Producto: IronLog
 * Fecha: 2026-02-27
 *
 * NOTA: Esto es un prototipo visual, no codigo de produccion.
 *
 * Lista de ejercicios con filtros por grupo muscular y ilustraciones SVG.
 * Cada tarjeta muestra: ilustracion, nombre, tipo (badge), grupo muscular (badge).
 * Inspiracion: Hevy exercise library — limpio, scannable, tappable.
 */

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
  },
  fonts: {
    sans: "'Geist Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'Geist Mono', 'SF Mono', monospace",
  },
  radius: { sm: 6, md: 8, lg: 12, xl: 16, full: 9999 },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 },
};

// --- Mock Data ---
const muscleGroups = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body'];

const exercises = [
  { id: 1, name: 'Bench Press', type: 'weights', muscleGroup: 'Chest', illustration: 'bench-press' },
  { id: 2, name: 'Incline Bench Press', type: 'weights', muscleGroup: 'Chest', illustration: 'incline-bench' },
  { id: 3, name: 'Push-ups', type: 'calisthenics', muscleGroup: 'Chest', illustration: 'push-ups' },
  { id: 4, name: 'Deadlift', type: 'weights', muscleGroup: 'Back', illustration: 'deadlift' },
  { id: 5, name: 'Barbell Row', type: 'weights', muscleGroup: 'Back', illustration: 'barbell-row' },
  { id: 6, name: 'Pull-ups', type: 'calisthenics', muscleGroup: 'Back', illustration: 'pull-ups' },
  { id: 7, name: 'Squat', type: 'weights', muscleGroup: 'Legs', illustration: 'squat' },
  { id: 8, name: 'Leg Press', type: 'weights', muscleGroup: 'Legs', illustration: 'leg-press' },
  { id: 9, name: 'Romanian Deadlift', type: 'weights', muscleGroup: 'Legs', illustration: 'rdl' },
  { id: 10, name: 'Overhead Press', type: 'weights', muscleGroup: 'Shoulders', illustration: 'ohp' },
  { id: 11, name: 'Lateral Raise', type: 'weights', muscleGroup: 'Shoulders', illustration: 'lateral-raise' },
  { id: 12, name: 'Barbell Curl', type: 'weights', muscleGroup: 'Arms', illustration: 'curl' },
  { id: 13, name: 'Running', type: 'cardio', muscleGroup: 'Full Body', illustration: 'running' },
  { id: 14, name: 'Plank', type: 'flexibility', muscleGroup: 'Core', illustration: 'plank' },
];

const typeColors = {
  weights: { bg: 'rgba(50, 145, 255, 0.12)', text: '#3291FF' },
  calisthenics: { bg: 'rgba(34, 197, 94, 0.12)', text: '#22C55E' },
  cardio: { bg: 'rgba(245, 158, 11, 0.12)', text: '#F59E0B' },
  hiit: { bg: 'rgba(244, 63, 94, 0.12)', text: '#F43F5E' },
  flexibility: { bg: 'rgba(148, 163, 184, 0.12)', text: '#94A3B8' },
};

// --- Components ---

/* Ilustracion placeholder — stick figure simplificado */
function ExerciseIllustration({ name, size = 44 }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.bgTertiary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      {/* SVG placeholder: stick figure generico */}
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="5" r="2.5" stroke={t.colors.themeSlate} strokeWidth="1.5" />
        <path d="M12 8v6M8 20l4-6 4 6M7 13h10" stroke={t.colors.themeSlate} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* Chip de filtro por grupo muscular */
function FilterChip({ label, active }) {
  return (
    <div style={{
      padding: `${t.space[1] + 2}px ${t.space[3]}px`,
      borderRadius: t.radius.full,
      backgroundColor: active ? t.colors.brandBlue : t.colors.bgTertiary,
      color: active ? '#FFFFFF' : t.colors.textSecondary,
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      fontFamily: t.fonts.sans,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      border: active ? 'none' : `1px solid ${t.colors.border}`,
    }}>
      {label}
    </div>
  );
}

/* Barra de filtros — scroll horizontal */
function FilterBar() {
  return (
    <div style={{
      padding: `${t.space[3]}px ${t.space[5]}px`,
      display: 'flex',
      gap: t.space[2],
      overflowX: 'auto',
      /* Hide scrollbar */
    }}>
      {muscleGroups.map((group, i) => (
        <FilterChip key={group} label={group} active={i === 0} />
      ))}
    </div>
  );
}

/* Badge de tipo de ejercicio */
function TypeBadge({ type }) {
  const c = typeColors[type] || typeColors.weights;
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      fontFamily: t.fonts.sans,
      color: c.text,
      backgroundColor: c.bg,
      padding: `2px ${t.space[2]}px`,
      borderRadius: t.radius.sm,
      textTransform: 'capitalize',
    }}>
      {type}
    </span>
  );
}

/* Tarjeta de ejercicio — fila horizontal con ilustracion */
function ExerciseCard({ exercise }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: t.space[3],
      padding: `${t.space[3]}px ${t.space[5]}px`,
      cursor: 'pointer',
      borderBottom: `1px solid ${t.colors.border}`,
    }}>
      <ExerciseIllustration name={exercise.illustration} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 16,
          fontWeight: 600,
          fontFamily: t.fonts.sans,
          color: t.colors.textPrimary,
          marginBottom: t.space[1],
        }}>
          {exercise.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: t.space[2] }}>
          <TypeBadge type={exercise.type} />
          <span style={{
            fontSize: 12,
            fontFamily: t.fonts.sans,
            color: t.colors.textTertiary,
          }}>
            {exercise.muscleGroup}
          </span>
        </div>
      </div>
      {/* Chevron derecho */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <path d="M9 6l6 6-6 6" stroke={t.colors.textTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* Header de la pantalla */
function ScreenHeader() {
  return (
    <div style={{
      padding: `${t.space[4]}px ${t.space[5]}px ${t.space[2]}px`,
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
        Exercises
      </h1>
      {/* Boton Add */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: t.radius.md,
        backgroundColor: t.colors.brandBlue,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 300,
      }}>
        +
      </div>
    </div>
  );
}

/* Contador de resultados */
function ResultCount() {
  return (
    <div style={{
      padding: `${t.space[1]}px ${t.space[5]}px ${t.space[2]}px`,
      fontSize: 13,
      fontFamily: t.fonts.sans,
      color: t.colors.textTertiary,
    }}>
      {exercises.length} exercises
    </div>
  );
}

/* Tab bar */
function TabBar() {
  const tabs = [
    { name: 'Home', icon: '🏠', active: false },
    { name: 'Exercises', icon: '🏋️', active: true },
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
export default function ExercisesPrototype() {
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
      <div style={{ height: 44 }} /> {/* Status bar space */}
      <ScreenHeader />
      <FilterBar />
      <ResultCount />
      {exercises.map((ex) => (
        <ExerciseCard key={ex.id} exercise={ex} />
      ))}
      <TabBar />
    </div>
  );
}
