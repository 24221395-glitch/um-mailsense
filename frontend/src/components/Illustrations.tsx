// Theme illustrations drawn as SVG so they stay sharp and work in light and dark themes.

/** The MailSense robot: white with a dark visor, glowing blue eyes and purple headphones. */
export function Mascot({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 340" role="img" aria-label="MailSense robot" className={className}>
      <defs>
        <linearGradient id="rb-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6e0ff" />
        </linearGradient>
        <linearGradient id="rb-purple" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8f74ff" />
          <stop offset="1" stopColor="#5b3ff8" />
        </linearGradient>
        <radialGradient id="rb-visor" cx="0.5" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#2a2470" />
          <stop offset="1" stopColor="#100c33" />
        </radialGradient>
        <filter id="rb-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="rb-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#5b3ff8" floodOpacity="0.22" />
        </filter>
      </defs>

      <g filter="url(#rb-shadow)">
        {/* body */}
        <rect x="102" y="214" width="116" height="96" rx="44" fill="url(#rb-shell)" />
        <path d="M160 238l18 7v13c0 12-8 21-18 25-10-4-18-13-18-25v-13z" fill="url(#rb-purple)" />
        <text
          x="160"
          y="268"
          textAnchor="middle"
          fontFamily="Poppins, sans-serif"
          fontSize="13"
          fontWeight="700"
          fill="#ffd65c"
        >
          UM
        </text>
        {/* arms */}
        <ellipse
          cx="96"
          cy="250"
          rx="16"
          ry="30"
          transform="rotate(18 96 250)"
          fill="url(#rb-shell)"
        />
        <ellipse
          cx="232"
          cy="228"
          rx="16"
          ry="30"
          transform="rotate(-40 232 228)"
          fill="url(#rb-shell)"
        />
        <circle cx="248" cy="204" r="14" fill="url(#rb-shell)" />

        {/* headphones */}
        <rect x="46" y="112" width="34" height="62" rx="17" fill="url(#rb-purple)" />
        <rect x="240" y="112" width="34" height="62" rx="17" fill="url(#rb-purple)" />
        {/* head */}
        <rect x="62" y="48" width="196" height="172" rx="86" fill="url(#rb-shell)" />
        <ellipse cx="120" cy="78" rx="36" ry="13" fill="#fff" />
        {/* visor + eyes */}
        <rect x="88" y="96" width="144" height="96" rx="48" fill="url(#rb-visor)" />
        <path
          d="M122 152q16-24 32 0M168 152q16-24 32 0"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="11"
          strokeLinecap="round"
          filter="url(#rb-glow)"
          opacity="0.8"
        />
        <path
          d="M122 152q16-24 32 0M168 152q16-24 32 0"
          fill="none"
          stroke="#bfe0ff"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

/** University building silhouette with trees, used as the page footer. */
export function Campus({ className = '' }: { className?: string }) {
  const stroke = 'var(--accent)'
  const fill = 'var(--surface-3)'
  const window = 'var(--accent)'
  return (
    <svg
      viewBox="0 0 1200 220"
      preserveAspectRatio="xMidYMax meet"
      role="img"
      aria-label="Universiti Malaya campus"
      className={className}
    >
      <defs>
        <linearGradient id="cp-hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--surface-3)" />
          <stop offset="1" stopColor="var(--bg)" />
        </linearGradient>
      </defs>
      {/* hills */}
      <path d="M0 170Q300 110 600 160T1200 150V220H0z" fill="url(#cp-hill)" />
      <path
        d="M0 170Q300 110 600 160T1200 150"
        fill="none"
        stroke={stroke}
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />

      {/* trees */}
      {[
        [330, 120, 34],
        [380, 135, 26],
        [860, 118, 36],
        [810, 136, 24],
      ].map(([x, y, r]) => (
        <g key={`${x}`}>
          <rect x={x - 3} y={y + r - 6} width="6" height={60 - r} fill={fill} />
          <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeOpacity="0.35" />
          <circle cx={x - r / 2.5} cy={y + r / 3} r={r * 0.7} fill={fill} />
          <circle cx={x + r / 2.5} cy={y + r / 3} r={r * 0.7} fill={fill} />
        </g>
      ))}

      {/* side wings with windows */}
      {[
        [420, 140],
        [690, 140],
      ].map(([x, y]) => (
        <g key={x}>
          <rect
            x={x}
            y={y}
            width="90"
            height="50"
            fill={fill}
            stroke={stroke}
            strokeOpacity="0.4"
          />
          {[0, 1, 2].map((c) =>
            [0, 1].map((r) => (
              <rect
                key={`${c}${r}`}
                x={x + 14 + c * 26}
                y={y + 10 + r * 18}
                width="10"
                height="11"
                fill={window}
                fillOpacity="0.55"
              />
            )),
          )}
        </g>
      ))}

      {/* main hall */}
      <path
        d="M470 108 600 62l130 46z"
        fill={fill}
        stroke={stroke}
        strokeOpacity="0.8"
        strokeWidth="2"
      />
      <rect
        x="480"
        y="108"
        width="240"
        height="10"
        fill={fill}
        stroke={stroke}
        strokeOpacity="0.6"
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect
          key={i}
          x={492 + i * 42}
          y="118"
          width="10"
          height="72"
          fill={fill}
          stroke={stroke}
          strokeOpacity="0.45"
        />
      ))}
      <rect
        x="470"
        y="188"
        width="260"
        height="8"
        fill={fill}
        stroke={stroke}
        strokeOpacity="0.6"
      />
      {/* name board */}
      <rect
        x="530"
        y="128"
        width="140"
        height="46"
        rx="3"
        fill="var(--bg)"
        stroke={stroke}
        strokeOpacity="0.7"
      />
      <text
        x="600"
        y="148"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="14"
        letterSpacing="1.5"
        fill="var(--ink-2)"
      >
        UNIVERSITI
      </text>
      <text
        x="600"
        y="166"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="14"
        letterSpacing="1.5"
        fill="var(--ink-2)"
      >
        MALAYA
      </text>
    </svg>
  )
}
