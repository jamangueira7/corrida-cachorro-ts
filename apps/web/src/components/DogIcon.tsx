/** Galgo correndo, desenho próprio em SVG. A cor e o número identificam o cão. */
export function DogIcon({ color, number, running }: { color: string; number: number; running: boolean }) {
  return (
    <svg
      className={`dog-icon${running ? ' is-running' : ''}`}
      viewBox="0 0 120 56"
      width="96"
      height="45"
      aria-hidden="true"
    >
      {/* rabo */}
      <path d="M14 22 C4 18 2 10 6 6" stroke="#2b2118" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* patas de trás */}
      <g className="legs legs-back">
        <path d="M24 30 L10 44" stroke="#2b2118" strokeWidth="5" strokeLinecap="round" />
        <path d="M28 30 L22 48" stroke="#3a2c20" strokeWidth="5" strokeLinecap="round" />
      </g>
      {/* patas da frente */}
      <g className="legs legs-front">
        <path d="M72 30 L90 44" stroke="#2b2118" strokeWidth="5" strokeLinecap="round" />
        <path d="M68 31 L78 48" stroke="#3a2c20" strokeWidth="5" strokeLinecap="round" />
      </g>
      {/* corpo esguio */}
      <path
        d="M14 24 C20 12 40 14 54 18 C64 20 72 16 80 14 C84 13 88 16 86 22 C84 30 74 34 62 32 C48 30 34 36 22 34 C16 33 12 29 14 24 Z"
        fill="#2b2118"
      />
      {/* pescoço e cabeça */}
      <path d="M78 16 C84 6 92 4 100 6 L114 12 C116 14 114 16 110 16 L98 17 C92 20 88 22 84 22 Z" fill="#2b2118" />
      <path d="M96 6 L92 0 L101 4 Z" fill="#2b2118" />
      <circle cx="103" cy="10" r="1.4" fill="#fff" />
      {/* colete com o número */}
      <path d="M38 17 C46 16 56 18 64 20 L62 32 C54 31 46 31 38 33 Z" fill={color} />
      <text x="50" y="29" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily="Outfit, sans-serif">
        {number}
      </text>
    </svg>
  );
}
