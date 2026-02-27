/**
 * Prototipo: Exercise Detail con Charts
 * Producto: IronLog
 * Fecha: 2026-02-27
 *
 * NOTA: Esto es un prototipo visual, no codigo de produccion.
 *
 * Detalle de un ejercicio: ilustracion grande, stats, graficas de progreso.
 * Dos graficas: peso maximo (line chart) y volumen (area chart).
 * Periodo seleccionable con chips.
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
    chartLine: '#3291FF',
    chartArea: 'rgba(50, 145, 255, 0.15)',
    chartGrid: '#2E2E2E',
    chartPR: '#F43F5E',
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
const exercise = {
  name: 'Bench Press',
  type: 'weights',
  muscleGroup: 'Chest',
  restSeconds: 120,
};

const stats = {
  currentPR: 95,
  lastWorkout: '2026-02-27',
  totalSessions: 34,
  avgVolume: 2340,
};

const periods = ['1W', '1M', '3M', '6M', 'All'];

// Chart mock: puntos de datos simulados para dibujar con SVG
const maxWeightData = [
  { x: 0, y: 70 }, { x: 1, y: 75 }, { x: 2, y: 75 },
  { x: 3, y: 80 }, { x: 4, y: 80 }, { x: 5, y: 85 },
  { x: 6, y: 82.5 }, { x: 7, y: 87.5 }, { x: 8, y: 90 },
  { x: 9, y: 90 }, { x: 10, y: 95 },
];

const recentHistory = [
  { date: '2026-02-27', sets: '4 sets', best: '95 kg x 6' },
  { date: '2026-02-24', sets: '4 sets', best: '90 kg x 8' },
  { date: '2026-02-21', sets: '3 sets', best: '87.5 kg x 8' },
  { date: '2026-02-18', sets: '4 sets', best: '85 kg x 10' },
  { date: '2026-02-14', sets: '3 sets', best: '85 kg x 8' },
];

// --- Components ---

/* Back button + titulo */
function DetailHeader() {
  return (
    <div style={{
      padding: `${t.space[3]}px ${t.space[5]}px`,
      display: 'flex',
      alignItems: 'center',
      gap: t.space[3],
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ cursor: 'pointer' }}>
        <path d="M15 18l-6-6 6-6" stroke={t.colors.textPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h1 style={{
        fontSize: 22,
        fontWeight: 700,
        fontFamily: t.fonts.sans,
        color: t.colors.textPrimary,
        margin: 0,
        letterSpacing: '-0.02em',
      }}>
        {exercise.name}
      </h1>
    </div>
  );
}

/* Ilustracion grande del ejercicio */
function LargeIllustration() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      padding: `${t.space[4]}px 0`,
    }}>
      <div style={{
        width: 120,
        height: 120,
        borderRadius: t.radius.xl,
        backgroundColor: t.colors.bgSecondary,
        border: `1px solid ${t.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Stick figure grande para bench press */}
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
          {/* Banco */}
          <rect x="14" y="42" width="44" height="4" rx="2" fill={t.colors.themeSlate} opacity="0.4" />
          <rect x="16" y="46" width="4" height="16" rx="2" fill={t.colors.themeSlate} opacity="0.3" />
          <rect x="52" y="46" width="4" height="16" rx="2" fill={t.colors.themeSlate} opacity="0.3" />
          {/* Persona acostada */}
          <circle cx="30" cy="34" r="5" stroke={t.colors.themeSlate} strokeWidth="2" />
          <path d="M30 39v8" stroke={t.colors.themeSlate} strokeWidth="2" strokeLinecap="round" />
          {/* Barra con discos */}
          <rect x="12" y="24" width="48" height="3" rx="1.5" fill={t.colors.themeSlate} />
          <rect x="8" y="20" width="6" height="11" rx="2" fill={t.colors.themeSlate} opacity="0.7" />
          <rect x="58" y="20" width="6" height="11" rx="2" fill={t.colors.themeSlate} opacity="0.7" />
          {/* Brazos empujando */}
          <path d="M24 36l-6-10M36 36l6-10" stroke={t.colors.themeSlate} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

/* Info badges debajo de la ilustracion */
function ExerciseInfo() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: t.space[2],
      marginBottom: t.space[4],
    }}>
      <span style={{
        fontSize: 12, fontWeight: 600, fontFamily: t.fonts.sans,
        color: '#3291FF', backgroundColor: 'rgba(50,145,255,0.12)',
        padding: `3px ${t.space[2]}px`, borderRadius: t.radius.sm,
        textTransform: 'capitalize',
      }}>
        {exercise.type}
      </span>
      <span style={{
        fontSize: 12, fontWeight: 500, fontFamily: t.fonts.sans,
        color: t.colors.textSecondary, backgroundColor: t.colors.bgTertiary,
        padding: `3px ${t.space[2]}px`, borderRadius: t.radius.sm,
      }}>
        {exercise.muscleGroup}
      </span>
      <span style={{
        fontSize: 12, fontWeight: 500, fontFamily: t.fonts.sans,
        color: t.colors.textSecondary, backgroundColor: t.colors.bgTertiary,
        padding: `3px ${t.space[2]}px`, borderRadius: t.radius.sm,
      }}>
        Rest {exercise.restSeconds}s
      </span>
    </div>
  );
}

/* Stats rápidas en grid 2x2 */
function QuickStats() {
  const items = [
    { label: 'Current PR', value: `${stats.currentPR}`, unit: 'kg', color: t.colors.brandRed },
    { label: 'Sessions', value: `${stats.totalSessions}`, unit: '', color: t.colors.textPrimary },
    { label: 'Last Workout', value: 'Today', unit: '', color: t.colors.success },
    { label: 'Avg Volume', value: `${(stats.avgVolume / 1000).toFixed(1)}`, unit: 't', color: t.colors.brandBlue },
  ];

  return (
    <div style={{
      padding: `0 ${t.space[5]}px`,
      marginBottom: t.space[6],
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: t.space[3],
      }}>
        {items.map((item, i) => (
          <div key={i} style={{
            backgroundColor: t.colors.bgSecondary,
            border: `1px solid ${t.colors.border}`,
            borderRadius: t.radius.lg,
            padding: t.space[3],
          }}>
            <div style={{
              fontSize: 11, fontWeight: 500, fontFamily: t.fonts.sans,
              color: t.colors.textTertiary, textTransform: 'uppercase',
              letterSpacing: '0.05em', marginBottom: t.space[1],
            }}>
              {item.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{
                fontSize: 24, fontWeight: 700, fontFamily: t.fonts.mono,
                color: item.color, lineHeight: 1,
              }}>
                {item.value}
              </span>
              {item.unit && (
                <span style={{ fontSize: 12, fontFamily: t.fonts.sans, color: t.colors.textTertiary }}>
                  {item.unit}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Period selector chips */
function PeriodSelector({ selected = '3M' }) {
  return (
    <div style={{
      display: 'flex',
      gap: t.space[1],
      marginBottom: t.space[3],
    }}>
      {periods.map((p) => (
        <div key={p} style={{
          padding: `${t.space[1]}px ${t.space[3]}px`,
          borderRadius: t.radius.full,
          backgroundColor: p === selected ? t.colors.brandBlue : t.colors.bgTertiary,
          color: p === selected ? '#FFFFFF' : t.colors.textSecondary,
          fontSize: 12,
          fontWeight: p === selected ? 600 : 400,
          fontFamily: t.fonts.sans,
          cursor: 'pointer',
        }}>
          {p}
        </div>
      ))}
    </div>
  );
}

/* Grafica SVG de progreso (line chart simplificado) */
function ProgressChart({ title, data, color = t.colors.chartLine, showArea = false }) {
  const width = 350;
  const height = 160;
  const padding = { top: 10, right: 10, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const minY = Math.min(...data.map(d => d.y)) - 5;
  const maxY = Math.max(...data.map(d => d.y)) + 5;
  const maxX = data.length - 1;

  const scaleX = (x) => padding.left + (x / maxX) * chartW;
  const scaleY = (y) => padding.top + chartH - ((y - minY) / (maxY - minY)) * chartH;

  const linePath = data.map((d, i) =>
    `${i === 0 ? 'M' : 'L'}${scaleX(d.x)},${scaleY(d.y)}`
  ).join(' ');

  const areaPath = linePath +
    ` L${scaleX(maxX)},${scaleY(minY)} L${scaleX(0)},${scaleY(minY)} Z`;

  // Y axis labels
  const ySteps = 5;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) =>
    Math.round(minY + (i / ySteps) * (maxY - minY))
  );

  return (
    <div style={{
      padding: `0 ${t.space[5]}px`,
      marginBottom: t.space[6],
    }}>
      <h3 style={{
        fontSize: 16, fontWeight: 600, fontFamily: t.fonts.sans,
        color: t.colors.textPrimary, margin: `0 0 ${t.space[2]}px`,
      }}>
        {title}
      </h3>
      <PeriodSelector />
      <div style={{
        backgroundColor: t.colors.bgSecondary,
        border: `1px solid ${t.colors.border}`,
        borderRadius: t.radius.lg,
        padding: t.space[3],
        overflow: 'hidden',
      }}>
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
          {/* Grid lines */}
          {yLabels.map((label, i) => (
            <g key={i}>
              <line
                x1={padding.left} y1={scaleY(label)}
                x2={width - padding.right} y2={scaleY(label)}
                stroke={t.colors.chartGrid} strokeWidth="0.5"
              />
              <text
                x={padding.left - 6} y={scaleY(label) + 4}
                fill={t.colors.textTertiary} fontSize="10"
                fontFamily={t.fonts.mono} textAnchor="end"
              >
                {label}
              </text>
            </g>
          ))}

          {/* Area fill (si aplica) */}
          {showArea && (
            <path d={areaPath} fill={t.colors.chartArea} />
          )}

          {/* Line */}
          <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={scaleX(d.x)}
              cy={scaleY(d.y)}
              r={i === data.length - 1 ? 4 : 3}
              fill={i === data.length - 1 ? t.colors.chartPR : color}
              stroke={t.colors.bgSecondary}
              strokeWidth="2"
            />
          ))}

          {/* PR marker en el ultimo punto (mas alto) */}
          {data[data.length - 1] && (
            <text
              x={scaleX(data[data.length - 1].x)}
              y={scaleY(data[data.length - 1].y) - 10}
              fill={t.colors.chartPR}
              fontSize="10"
              fontFamily={t.fonts.mono}
              fontWeight="700"
              textAnchor="middle"
            >
              {data[data.length - 1].y} kg PR
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}

/* Historial reciente de este ejercicio */
function RecentHistory() {
  return (
    <div style={{ padding: `0 ${t.space[5]}px`, marginBottom: t.space[8] }}>
      <h3 style={{
        fontSize: 16, fontWeight: 600, fontFamily: t.fonts.sans,
        color: t.colors.textPrimary, margin: `0 0 ${t.space[3]}px`,
      }}>
        Recent History
      </h3>
      <div style={{
        backgroundColor: t.colors.bgSecondary,
        border: `1px solid ${t.colors.border}`,
        borderRadius: t.radius.lg,
        overflow: 'hidden',
      }}>
        {recentHistory.map((h, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: `${t.space[3]}px ${t.space[4]}px`,
            borderBottom: i < recentHistory.length - 1 ? `1px solid ${t.colors.border}` : 'none',
          }}>
            <div>
              <div style={{
                fontSize: 14, fontWeight: 500, fontFamily: t.fonts.sans,
                color: t.colors.textPrimary,
              }}>
                {h.date}
              </div>
              <div style={{
                fontSize: 12, fontFamily: t.fonts.sans,
                color: t.colors.textSecondary, marginTop: 2,
              }}>
                {h.sets}
              </div>
            </div>
            <div style={{
              fontSize: 14, fontWeight: 600, fontFamily: t.fonts.mono,
              color: t.colors.brandBlue,
            }}>
              {h.best}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Pantalla completa ---
export default function ExerciseDetailPrototype() {
  return (
    <div style={{
      fontFamily: t.fonts.sans,
      backgroundColor: t.colors.bgPrimary,
      color: t.colors.textPrimary,
      minHeight: '100vh',
      maxWidth: 430,
      margin: '0 auto',
    }}>
      <div style={{ height: 44 }} />
      <DetailHeader />
      <LargeIllustration />
      <ExerciseInfo />
      <QuickStats />
      <ProgressChart
        title="Max Weight"
        data={maxWeightData}
        color={t.colors.chartLine}
      />
      <ProgressChart
        title="Volume"
        data={[
          { x: 0, y: 1680 }, { x: 1, y: 2100 }, { x: 2, y: 1800 },
          { x: 3, y: 2400 }, { x: 4, y: 2100 }, { x: 5, y: 2550 },
          { x: 6, y: 2200 }, { x: 7, y: 2700 }, { x: 8, y: 2850 },
          { x: 9, y: 2600 }, { x: 10, y: 3040 },
        ]}
        color={t.colors.chartLine}
        showArea={true}
      />
      <RecentHistory />
    </div>
  );
}
