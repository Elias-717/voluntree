// A water drop for the watering moments (DEC-053). Purely decorative; the motion lives in globals.css.

export function WaterDrop({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 32" aria-hidden className={className} style={style}>
      <path d="M12 1C12 1 2 13.5 2 20a10 10 0 0 0 20 0C22 13.5 12 1 12 1Z" fill="#8fd3ff" />
      <path d="M7.5 20.5a4.5 4.5 0 0 0 3 4" fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" opacity={0.8} />
    </svg>
  );
}
