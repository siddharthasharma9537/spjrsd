/* The Moon's phase from its distance from the Sun in degrees (0 new moon, 180 full moon; below 180 it is waxing, lit on the
   right as seen from India). The lit part is the outer half-circle on the lit side closed by the terminator, a half-ellipse
   whose width is |cos(phase)| of the radius: it bulges towards the lit side for a crescent and away from it past half. */
export default function MoonPhase({ degrees, size = 72, className = '' }) {
  const r = 46;
  const phase = ((Number(degrees) % 360) + 360) % 360;
  const waxing = phase < 180;
  const k = Math.cos((phase * Math.PI) / 180);
  const outer = waxing ? 1 : 0;
  const inner = k > 0 ? (waxing ? 0 : 1) : (waxing ? 1 : 0);
  const lit = `M 50 ${50 - r} A ${r} ${r} 0 0 ${outer} 50 ${50 + r} A ${Math.abs(k) * r} ${r} 0 0 ${inner} 50 ${50 - r} Z`;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img"
         aria-label={`Moon phase, ${Math.round(phase)} degrees from the Sun`}>
      <circle cx="50" cy="50" r={r} fill="#6B6B78" />
      <path d={lit} fill="#F5F0E3" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="#D4AF37" strokeOpacity="0.5" strokeWidth="1.5" />
    </svg>
  );
}
