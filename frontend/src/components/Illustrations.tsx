// Theme illustrations drawn as SVG so they stay sharp and work in light and dark themes.

/** The MailSense robot: orange, smiling visor, "UM" on the chest, holding an envelope. */
export function Mascot({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 360"
      role="img"
      aria-label="MailSense robot holding an email"
      className={className}
    >
      <defs>
        <linearGradient id="ms-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb44d" />
          <stop offset="1" stopColor="#e4730c" />
        </linearGradient>
        <linearGradient id="ms-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d06a0b" />
          <stop offset="1" stopColor="#9c4c06" />
        </linearGradient>
        <radialGradient id="ms-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f7931e" stopOpacity="0.45" />
          <stop offset="1" stopColor="#f7931e" stopOpacity="0" />
        </radialGradient>
        <filter id="ms-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* glow and orbit ring */}
      <ellipse cx="170" cy="200" rx="160" ry="150" fill="url(#ms-glow)" />
      <ellipse
        cx="170"
        cy="318"
        rx="160"
        ry="30"
        fill="none"
        stroke="#f7931e"
        strokeOpacity="0.55"
        strokeWidth="3"
        filter="url(#ms-soft)"
      />
      <ellipse
        cx="170"
        cy="318"
        rx="160"
        ry="30"
        fill="none"
        stroke="#ffb547"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />

      {/* antenna */}
      <rect x="164" y="24" width="8" height="40" rx="4" fill="url(#ms-dark)" />
      <circle cx="168" cy="22" r="14" fill="url(#ms-body)" />
      <circle cx="163" cy="17" r="4" fill="#fff" fillOpacity="0.55" />

      {/* left arm (resting) */}
      <ellipse
        cx="106"
        cy="262"
        rx="20"
        ry="34"
        transform="rotate(20 106 262)"
        fill="url(#ms-dark)"
      />

      {/* body */}
      <rect x="110" y="214" width="118" height="100" rx="44" fill="url(#ms-body)" />
      <text
        x="169"
        y="278"
        textAnchor="middle"
        fontFamily="Poppins, sans-serif"
        fontSize="30"
        fontWeight="700"
        fill="#b85a07"
        opacity="0.85"
      >
        UM
      </text>

      {/* right arm (raised, holding the email) */}
      <ellipse
        cx="234"
        cy="238"
        rx="18"
        ry="32"
        transform="rotate(-35 234 238)"
        fill="url(#ms-dark)"
      />

      {/* head */}
      <circle cx="78" cy="148" r="26" fill="url(#ms-dark)" />
      <circle cx="262" cy="148" r="26" fill="url(#ms-dark)" />
      <rect x="72" y="60" width="196" height="166" rx="83" fill="url(#ms-body)" />
      <ellipse cx="128" cy="92" rx="34" ry="14" fill="#fff" fillOpacity="0.25" />
      {/* visor + smiling eyes */}
      <rect x="96" y="104" width="148" height="92" rx="46" fill="#1a120b" />
      <path
        d="M128 158q16-26 32 0M180 158q16-26 32 0"
        fill="none"
        stroke="#fff4e3"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* envelope card */}
      <g transform="rotate(-6 268 210)">
        <rect
          x="226"
          y="176"
          width="88"
          height="68"
          rx="12"
          fill="#2a1a0e"
          stroke="#f7931e"
          strokeWidth="3"
        />
        <rect
          x="226"
          y="176"
          width="88"
          height="68"
          rx="12"
          fill="none"
          stroke="#f7931e"
          strokeOpacity="0.6"
          strokeWidth="8"
          filter="url(#ms-soft)"
        />
        <rect
          x="244"
          y="192"
          width="52"
          height="36"
          rx="4"
          fill="none"
          stroke="#ffb547"
          strokeWidth="3.5"
        />
        <path
          d="m246 195 24 17 24-17"
          fill="none"
          stroke="#ffb547"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      </g>
      {/* hand over the card */}
      <circle cx="232" cy="222" r="15" fill="url(#ms-body)" />
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
