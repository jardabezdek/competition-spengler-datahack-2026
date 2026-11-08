export function PuckIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <ellipse cx="10" cy="8" rx="7" ry="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 8v3.2a7 3.2 0 0 0 14 0V8" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function WhistleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="7" cy="11" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 10.2 17 7.5v3.2L10 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
