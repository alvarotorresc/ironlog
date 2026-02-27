/**
 * IronLog Logo — Componente React SVG
 *
 * Concepto: Una barra de pesas estilizada formando una "I" (de Iron/IronLog).
 * La barra es vertical con discos a los lados, minimalista y geometrica.
 * Funciona en cualquier tamano (16px favicon a pantalla completa).
 * Reconocible en monocromo y en color.
 */

export function Logo({ size = 32, color = 'currentColor', className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="IronLog logo"
    >
      {/* Barra central (la barra de la pesa) */}
      <rect x="14" y="4" width="4" height="24" rx="2" fill={color} />

      {/* Disco izquierdo exterior */}
      <rect x="4" y="8" width="4" height="16" rx="2" fill={color} opacity="0.6" />

      {/* Disco izquierdo interior */}
      <rect x="9" y="6" width="4" height="20" rx="2" fill={color} opacity="0.8" />

      {/* Disco derecho interior */}
      <rect x="19" y="6" width="4" height="20" rx="2" fill={color} opacity="0.8" />

      {/* Disco derecho exterior */}
      <rect x="24" y="8" width="4" height="16" rx="2" fill={color} opacity="0.6" />
    </svg>
  );
}

/**
 * Variante monochrome — identica a default, usa currentColor.
 * Incluida como alias explicito para claridad.
 */
export function LogoMonochrome(props) {
  return <Logo {...props} />;
}

/**
 * Variante con texto — Logo + "IronLog" al lado.
 * Para headers y splash screens.
 */
export function LogoWithText({ size = 32, color = 'currentColor', className = '' }) {
  const fontSize = size * 0.6;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.25 }} className={className}>
      <Logo size={size} color={color} />
      <span
        style={{
          fontSize,
          fontWeight: 700,
          fontFamily: "'Geist Sans', 'Inter', -apple-system, sans-serif",
          color,
          letterSpacing: '-0.02em',
        }}
      >
        IronLog
      </span>
    </div>
  );
}
