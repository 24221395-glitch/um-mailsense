// Theme illustrations drawn as SVG so they stay sharp at any size and in both themes.
import { useId } from 'react'

/**
 * The MailSense robot: glossy white shell, dark indigo visor with glowing cyan eyes and smile,
 * purple headphone pods and gloves, and a crest badge on the chest (chibi proportions).
 */
export function Mascot({
  className = '',
  waving = true,
}: {
  className?: string
  waving?: boolean
}) {
  // unique ids so several robots on one page don't share gradients
  const uid = useId().replace(/:/g, '')
  const id = (name: string) => `${name}-${uid}`
  const url = (name: string) => `url(#${id(name)})`

  return (
    <svg viewBox="0 0 400 470" role="img" aria-label="MailSense robot" className={className}>
      <defs>
        {/* shell: white top-left, lavender bottom-right */}
        <linearGradient id={id('shell')} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#f3f0ff" />
          <stop offset="1" stopColor="#d6cbff" />
        </linearGradient>
        <radialGradient id={id('shellShade')} cx="0.78" cy="0.85" r="0.75">
          <stop offset="0" stopColor="#b9a8ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#b9a8ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('shine')} cx="0.3" cy="0.22" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {/* visor */}
        <linearGradient id={id('visor')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2575" />
          <stop offset="1" stopColor="#100c35" />
        </linearGradient>
        <radialGradient id={id('visorGlow')} cx="0.5" cy="0.55" r="0.6">
          <stop offset="0" stopColor="#4f46e5" stopOpacity="0.35" />
          <stop offset="1" stopColor="#4f46e5" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('visorGloss')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* purple parts */}
        <linearGradient id={id('purple')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a996ff" />
          <stop offset="1" stopColor="#6244f2" />
        </linearGradient>
        <linearGradient id={id('purpleDark')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6b52f5" />
          <stop offset="1" stopColor="#3f27c4" />
        </linearGradient>
        {/* crest */}
        <linearGradient id={id('crest')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b4fd8" />
          <stop offset="1" stopColor="#152a8a" />
        </linearGradient>
        <radialGradient id={id('aura')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#8b6dff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#8b6dff" stopOpacity="0" />
        </radialGradient>
        <filter id={id('glow')} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
        <filter id={id('soft')} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id={id('drop')} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#4b2fd6" floodOpacity="0.22" />
        </filter>
        <clipPath id={id('headClip')}>
          <rect x="74" y="34" width="252" height="222" rx="104" />
        </clipPath>
        <clipPath id={id('bodyClip')}>
          <rect x="124" y="260" width="152" height="140" rx="70" />
        </clipPath>
      </defs>

      {/* aura + ground shadow */}
      <ellipse cx="200" cy="230" rx="190" ry="200" fill={url('aura')} />
      <ellipse
        cx="200"
        cy="448"
        rx="92"
        ry="12"
        fill="#4b2fd6"
        opacity="0.18"
        filter={url('soft')}
      />

      <g filter={url('drop')}>
        {/* back headphone pod (left, partly hidden) */}
        <ellipse cx="74" cy="152" rx="26" ry="40" fill={url('purpleDark')} />

        {/* left arm: chunky white upper arm, purple forearm and glove, held out */}
        <g fill="none" strokeLinecap="round">
          <path d="M146 300 112 318" stroke={url('shell')} strokeWidth="46" />
          <path d="M108 320 80 332" stroke={url('purple')} strokeWidth="40" />
        </g>
        <circle cx="70" cy="334" r="25" fill={url('purple')} />
        <ellipse cx="62" cy="324" rx="8" ry="6" fill="#ffffff" opacity="0.35" />

        {/* right arm: waving or resting */}
        {waving ? (
          <>
            <g fill="none" strokeLinecap="round">
              <path d="M254 298 288 284" stroke={url('shell')} strokeWidth="46" />
              <path d="M292 282 312 246" stroke={url('purple')} strokeWidth="40" />
            </g>
            <circle cx="318" cy="232" r="25" fill={url('purple')} />
            <ellipse cx="310" cy="222" rx="8" ry="6" fill="#ffffff" opacity="0.35" />
          </>
        ) : (
          <>
            <g fill="none" strokeLinecap="round">
              <path d="M254 300 280 326" stroke={url('shell')} strokeWidth="46" />
              <path d="M282 330 290 364" stroke={url('purple')} strokeWidth="40" />
            </g>
            <circle cx="292" cy="376" r="23" fill={url('purple')} />
          </>
        )}

        {/* body */}
        <rect x="124" y="260" width="152" height="140" rx="70" fill={url('shell')} />
        <g clipPath={url('bodyClip')}>
          <rect x="124" y="260" width="152" height="140" fill={url('shellShade')} />
          <ellipse cx="200" cy="262" rx="62" ry="16" fill="#9d8aff" opacity="0.28" />
          <ellipse cx="168" cy="296" rx="26" ry="16" fill={url('shine')} opacity="0.9" />
        </g>
        {/* crest badge */}
        <g transform="translate(164 302)">
          <path
            d="M0 0h30v17c0 12-7 19-15 23C7 36 0 29 0 17z"
            fill={url('crest')}
            stroke="#f5c542"
            strokeWidth="2.4"
          />
          <rect x="6" y="6" width="7" height="7" rx="1" fill="#f5c542" />
          <rect x="17" y="6" width="7" height="7" rx="1" fill="#f5c542" />
          <rect x="6" y="17" width="7" height="7" rx="1" fill="#f5c542" />
          <rect x="17" y="17" width="7" height="7" rx="1" fill="#f5c542" />
        </g>

        {/* neck */}
        <rect x="170" y="246" width="60" height="22" rx="11" fill="#cfc3ff" />

        {/* head */}
        <rect x="74" y="34" width="252" height="222" rx="104" fill={url('shell')} />
        <g clipPath={url('headClip')}>
          <rect x="74" y="34" width="252" height="222" fill={url('shellShade')} />
          <ellipse cx="150" cy="70" rx="80" ry="34" fill={url('shine')} />
        </g>
        <rect
          x="74"
          y="34"
          width="252"
          height="222"
          rx="104"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          opacity="0.8"
        />

        {/* front headphone pod (right) */}
        <ellipse cx="328" cy="150" rx="30" ry="44" fill={url('purple')} />
        <ellipse cx="333" cy="150" rx="16" ry="26" fill={url('purpleDark')} />
        <ellipse cx="320" cy="132" rx="7" ry="11" fill="#ffffff" opacity="0.35" />

        {/* visor */}
        <rect x="104" y="80" width="194" height="136" rx="62" fill={url('visor')} />
        <rect x="104" y="80" width="194" height="136" rx="62" fill={url('visorGlow')} />
        <rect
          x="104"
          y="80"
          width="194"
          height="136"
          rx="62"
          fill="none"
          stroke="#5b4fd6"
          strokeOpacity="0.55"
          strokeWidth="3"
        />
        <path d="M128 112c18-22 50-26 86-26h20c-50 4-80 16-100 40z" fill={url('visorGloss')} />

        {/* face: glowing eyes + smile */}
        <g fill="none" strokeLinecap="round">
          <g stroke="#38bdf8" strokeWidth="14" opacity="0.75" filter={url('glow')}>
            <path d="M150 156q16-22 32 0M220 156q16-22 32 0" />
            <path d="M184 182q17 14 34 0" />
          </g>
          <g stroke="#c7f3ff" strokeWidth="7">
            <path d="M150 156q16-22 32 0M220 156q16-22 32 0" />
            <path d="M184 182q17 14 34 0" />
          </g>
        </g>
      </g>
    </svg>
  )
}
