/**
 * Prototipo: Workout Tracking (CORE)
 * Producto: IronLog
 * Fecha: 2026-02-27
 *
 * NOTA: Esto es un prototipo visual, no codigo de produccion.
 *
 * Esta es LA pantalla. Donde pasa todo. El usuario esta en el gym,
 * entre sets, con una mano. Cada tap cuenta. Los numeros son enormes,
 * el boton "+" es imposible de fallar, y el timer esta siempre visible.
 *
 * Inspiracion: Hevy workout screen — sets como filas, input inline.
 * Mejora: numeros mas grandes, timer como banner persistente.
 */

const t = {
  colors: {
    bgPrimary: '#0A0A0A',
    bgSecondary: '#111111',
    bgTertiary: '#1A1A1A',
    bgElevated: '#1F1F1F',
    border: '#2E2E2E',
    borderBright: '#3A3A3A',
    textPrimary: '#EDEDED',
    textSecondary: '#A3A3A3',
    textTertiary: '#525252',
    brandBlue: '#3291FF',
    brandRed: '#F43F5E',
    themeSlate: '#64748B',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  fonts: {
    sans: "'Geist Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'Geist Mono', 'SF Mono', monospace",
  },
  radius: { sm: 6, md: 8, lg: 12, xl: 16 },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 },
};

// --- Mock Data ---
const workout = {
  routineName: 'Push Day',
  startedAt: '14:35',
  elapsed: '32:15',
  exercises: [
    {
      id: 1,
      name: 'Bench Press',
      type: 'weights',
      illustration: 'bench-press',
      restSeconds: 120,
      sets: [
        { id: 1, order: 1, weight: 70, reps: 12, completed: true },
        { id: 2, order: 2, weight: 80, reps: 10, completed: true },
        { id: 3, order: 3, weight: 90, reps: 8, completed: true },
        { id: 4, order: 4, weight: 95, reps: 6, completed: false },
      ],
    },
    {
      id: 2,
      name: 'Incline Bench Press',
      type: 'weights',
      illustration: 'incline-bench',
      restSeconds: 90,
      sets: [
        { id: 5, order: 1, weight: 60, reps: 10, completed: true },
        { id: 6, order: 2, weight: 65, reps: 8, completed: false },
      ],
    },
    {
      id: 3,
      name: 'Overhead Press',
      type: 'weights',
      illustration: 'ohp',
      restSeconds: 120,
      sets: [],
    },
    {
      id: 4,
      name: 'Lateral Raise',
      type: 'weights',
      illustration: 'lateral-raise',
      restSeconds: 60,
      sets: [],
    },
    {
      id: 5,
      name: 'Push-ups',
      type: 'calisthenics',
      illustration: 'push-ups',
      restSeconds: 60,
      sets: [],
    },
  ],
};

// --- Components ---

/* Header del workout activo — nombre de rutina + timer + finish */
function WorkoutHeader() {
  return (
    <div style={{
      padding: `${t.space[3]}px ${t.space[5]}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${t.colors.border}`,
      backgroundColor: t.colors.bgPrimary,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div>
        <div style={{
          fontSize: 18,
          fontWeight: 700,
          fontFamily: t.fonts.sans,
          color: t.colors.textPrimary,
        }}>
          {workout.routineName}
        </div>
        <div style={{
          fontSize: 14,
          fontFamily: t.fonts.mono,
          color: t.colors.brandBlue,
          marginTop: 2,
        }}>
          {workout.elapsed}
        </div>
      </div>
      <button style={{
        padding: `${t.space[2]}px ${t.space[4]}px`,
        borderRadius: t.radius.md,
        backgroundColor: t.colors.success,
        border: 'none',
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 700,
        fontFamily: t.fonts.sans,
        cursor: 'pointer',
      }}>
        Finish
      </button>
    </div>
  );
}

/* Fila de set — EL componente mas importante de toda la app */
function SetRow({ set, exerciseType, isLast }) {
  const completed = set.completed;
  return (
    <div style={{
      display: 'grid',
      /* Grid: set# | peso | reps | check/delete */
      gridTemplateColumns: '32px 1fr 1fr 36px',
      gap: t.space[2],
      alignItems: 'center',
      padding: `${t.space[2]}px 0`,
      borderBottom: isLast ? 'none' : `1px solid ${t.colors.border}`,
      opacity: completed ? 1 : 0.7,
    }}>
      {/* Numero de set */}
      <div style={{
        fontSize: 14,
        fontWeight: 600,
        fontFamily: t.fonts.sans,
        color: completed ? t.colors.textSecondary : t.colors.textTertiary,
        textAlign: 'center',
      }}>
        {set.order}
      </div>

      {/* Campo de peso */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: t.colors.bgTertiary,
        borderRadius: t.radius.sm,
        padding: `${t.space[2]}px ${t.space[3]}px`,
        border: `1px solid ${completed ? t.colors.border : t.colors.borderBright}`,
      }}>
        <span style={{
          fontSize: 18,
          fontWeight: 700,
          fontFamily: t.fonts.mono,
          color: t.colors.textPrimary,
          flex: 1,
          /* Numeros grandes y legibles — la clave de la UX */
        }}>
          {set.weight}
        </span>
        <span style={{
          fontSize: 12,
          fontFamily: t.fonts.sans,
          color: t.colors.textTertiary,
        }}>
          kg
        </span>
      </div>

      {/* Campo de reps */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: t.colors.bgTertiary,
        borderRadius: t.radius.sm,
        padding: `${t.space[2]}px ${t.space[3]}px`,
        border: `1px solid ${completed ? t.colors.border : t.colors.borderBright}`,
      }}>
        <span style={{
          fontSize: 18,
          fontWeight: 700,
          fontFamily: t.fonts.mono,
          color: t.colors.textPrimary,
          flex: 1,
        }}>
          {set.reps}
        </span>
        <span style={{
          fontSize: 12,
          fontFamily: t.fonts.sans,
          color: t.colors.textTertiary,
        }}>
          reps
        </span>
      </div>

      {/* Check / Complete button */}
      <div style={{
        width: 32,
        height: 32,
        borderRadius: t.radius.sm,
        backgroundColor: completed ? t.colors.success : t.colors.bgTertiary,
        border: completed ? 'none' : `1px solid ${t.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}>
        {completed && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
  );
}

/* Seccion de un ejercicio en el workout */
function ExerciseSection({ exercise }) {
  const hasSets = exercise.sets.length > 0;
  return (
    <div style={{
      marginBottom: t.space[4],
      backgroundColor: t.colors.bgSecondary,
      border: `1px solid ${t.colors.border}`,
      borderRadius: t.radius.lg,
      padding: t.space[4],
    }}>
      {/* Exercise header con ilustracion */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: t.space[3],
        marginBottom: hasSets ? t.space[3] : 0,
      }}>
        {/* Ilustracion placeholder */}
        <div style={{
          width: 36,
          height: 36,
          borderRadius: t.radius.md,
          backgroundColor: t.colors.bgTertiary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="5" r="2.5" stroke={t.colors.themeSlate} strokeWidth="1.5" />
            <path d="M12 8v6M8 20l4-6 4 6M7 13h10" stroke={t.colors.themeSlate} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 16,
            fontWeight: 600,
            fontFamily: t.fonts.sans,
            color: t.colors.textPrimary,
          }}>
            {exercise.name}
          </div>
          {hasSets && (
            <div style={{
              fontSize: 12,
              fontFamily: t.fonts.sans,
              color: t.colors.textTertiary,
              marginTop: 2,
            }}>
              {exercise.sets.filter(s => s.completed).length}/{exercise.sets.length} sets · Rest {exercise.restSeconds}s
            </div>
          )}
        </div>
      </div>

      {/* Set headers */}
      {hasSets && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '32px 1fr 1fr 36px',
          gap: t.space[2],
          marginBottom: t.space[1],
          padding: `0 0 ${t.space[1]}px`,
        }}>
          <span style={{ fontSize: 11, color: t.colors.textTertiary, fontFamily: t.fonts.sans, textAlign: 'center' }}>SET</span>
          <span style={{ fontSize: 11, color: t.colors.textTertiary, fontFamily: t.fonts.sans }}>WEIGHT</span>
          <span style={{ fontSize: 11, color: t.colors.textTertiary, fontFamily: t.fonts.sans }}>REPS</span>
          <span></span>
        </div>
      )}

      {/* Sets */}
      {exercise.sets.map((set, i) => (
        <SetRow
          key={set.id}
          set={set}
          exerciseType={exercise.type}
          isLast={i === exercise.sets.length - 1}
        />
      ))}

      {/* Boton + Add Set — GRANDE, imposible de fallar con una mano */}
      <button style={{
        width: '100%',
        height: 44,
        marginTop: hasSets ? t.space[3] : t.space[2],
        backgroundColor: t.colors.bgTertiary,
        border: `1px dashed ${t.colors.borderBright}`,
        borderRadius: t.radius.md,
        color: t.colors.brandBlue,
        fontSize: 14,
        fontWeight: 600,
        fontFamily: t.fonts.sans,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: t.space[1],
      }}>
        <span style={{ fontSize: 18 }}>+</span>
        Add Set
      </button>
    </div>
  );
}

/* Rest Timer Banner — pegado al bottom, encima del tab bar */
function RestTimerBanner() {
  const remaining = 87; // 1:27
  const total = 120;
  const progress = ((total - remaining) / total) * 100;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 20,
    }}>
      {/* Progress bar en el borde superior */}
      <div style={{
        height: 3,
        backgroundColor: t.colors.border,
        position: 'relative',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          backgroundColor: t.colors.warning,
          transition: 'width 1s linear',
        }} />
      </div>

      <div style={{
        backgroundColor: t.colors.bgElevated,
        borderTop: `1px solid ${t.colors.border}`,
        padding: `${t.space[3]}px ${t.space[5]}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: t.space[3] }}>
          {/* Timer circular mini */}
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: `3px solid ${t.colors.warning}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: t.fonts.mono,
              color: t.colors.warning,
            }}>
              {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              fontFamily: t.fonts.sans,
              color: t.colors.textPrimary,
            }}>
              Rest Timer
            </div>
            <div style={{
              fontSize: 12,
              fontFamily: t.fonts.sans,
              color: t.colors.textSecondary,
            }}>
              Bench Press · 2:00
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: t.space[2] }}>
          {/* Quick time presets */}
          {['30', '60', '90'].map((s) => (
            <div key={s} style={{
              padding: `${t.space[1]}px ${t.space[2]}px`,
              borderRadius: t.radius.sm,
              backgroundColor: t.colors.bgTertiary,
              border: `1px solid ${t.colors.border}`,
              fontSize: 11,
              fontWeight: 500,
              fontFamily: t.fonts.mono,
              color: t.colors.textSecondary,
              cursor: 'pointer',
            }}>
              {s}s
            </div>
          ))}
          {/* Skip button */}
          <button style={{
            padding: `${t.space[1]}px ${t.space[3]}px`,
            borderRadius: t.radius.sm,
            backgroundColor: 'transparent',
            border: `1px solid ${t.colors.border}`,
            color: t.colors.textSecondary,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: t.fonts.sans,
            cursor: 'pointer',
          }}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Pantalla completa ---
export default function WorkoutTrackingPrototype() {
  return (
    <div style={{
      fontFamily: t.fonts.sans,
      backgroundColor: t.colors.bgPrimary,
      color: t.colors.textPrimary,
      minHeight: '100vh',
      maxWidth: 430,
      margin: '0 auto',
      paddingBottom: 120,
      /* Extra padding para el timer banner */
    }}>
      <div style={{ height: 44 }} />
      <WorkoutHeader />
      <div style={{ padding: `${t.space[4]}px ${t.space[5]}px 0` }}>
        {workout.exercises.map((ex) => (
          <ExerciseSection key={ex.id} exercise={ex} />
        ))}
      </div>
      <RestTimerBanner />
    </div>
  );
}
