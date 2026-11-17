// Line icons in the style of the MailSense theme. All take className for size/colour.
import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { className?: string }

function Icon({ children, className = 'h-5 w-5', ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  )
}

export const MailIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
  </Icon>
)
export const InboxIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 13h5l1.5 3h5L16 13h5" />
    <path d="M5 5h14l2 8v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z" />
  </Icon>
)
export const MegaphoneIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 10v4h3l7 4V6L6 10z" />
    <path d="M16.5 9a4 4 0 0 1 0 6" />
    <path d="M7 14l1 5h2.5l-1-4.5" />
  </Icon>
)
export const TrophyIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
    <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" />
    <path d="M12 13v4M9 20h6M10 17h4" />
  </Icon>
)
export const FlaskIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 3h6M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3" />
    <path d="M7.5 15h9" />
  </Icon>
)
export const CalendarIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M8 3v4M16 3v4M3.5 10h17" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
  </Icon>
)
export const GradCapIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m2 9 10-5 10 5-10 5z" />
    <path d="M6 11v5c3 2.5 9 2.5 12 0v-5" />
    <path d="M22 9v5" />
  </Icon>
)
export const UsersIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M3 19a6 6 0 0 1 12 0M14.5 15.5A5 5 0 0 1 21 19" />
  </Icon>
)
export const BanIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m6 6 12 12" />
  </Icon>
)
export const StarIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
  </Icon>
)
export const FileIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </Icon>
)
export const GridIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </Icon>
)
export const BuildingIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 21h18M5 21V10M19 21V10M9 21v-6h6v6" />
    <path d="m2 10 10-6 10 6" />
  </Icon>
)
export const ShieldIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
)
export const LockIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Icon>
)
export const BankIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m3 9 9-5 9 5" />
    <path d="M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 20h18" />
  </Icon>
)
export const TargetIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" />
    <path d="m15 9 5-5M17 4h3v3" />
  </Icon>
)
export const SparkleIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </Icon>
)
export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icon>
)
export const MoonIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  </Icon>
)
export const LogoutIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />
  </Icon>
)
export const RefreshIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4" />
  </Icon>
)
export const MenuIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
)
export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
)
export const UploadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </Icon>
)

export const KeyShieldIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6z" />
    <circle cx="12" cy="11" r="2" />
    <path d="M12 13v3" />
  </Icon>
)
export const HomeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m3 11 9-7 9 7" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
  </Icon>
)
export const BellIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Icon>
)
export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </Icon>
)
export const BookmarkIcon = (p: IconProps & { filled?: boolean }) => {
  const { filled, ...rest } = p
  return (
    <Icon {...rest}>
      <path d="M6 3h12v18l-6-4-6 4z" fill={filled ? 'currentColor' : 'none'} />
    </Icon>
  )
}
export const FilterIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 5h16l-6 7v6l-4 2v-8z" />
  </Icon>
)
export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Icon>
)
export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
)
export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
)
export const ArrowLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </Icon>
)
export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)
export const ExternalIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Icon>
)

/** Microsoft four-square logo (Sign in with Siswamail). */
export const MicrosoftLogo = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg viewBox="0 0 21 21" aria-hidden="true" className={className}>
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
)

export const GoogleLogo = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
    <path
      fill="#FFC107"
      d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"
    />
    <path
      fill="#FF3D00"
      d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"
    />
  </svg>
)

/** Purple envelope logo from the theme. light=true for use on the dark sidebar. */
export function Logo({ className = '', light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 40 32" aria-hidden="true" className="h-8 w-10">
        <defs>
          <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7c5cff" />
            <stop offset="1" stopColor="#5b3ff8" />
          </linearGradient>
        </defs>
        <rect
          x="2"
          y="3"
          width="36"
          height="26"
          rx="5"
          fill="none"
          stroke={light ? '#fff' : 'url(#logo-g)'}
          strokeWidth="3.4"
        />
        <path
          d="m4 6 16 12L36 6"
          fill="none"
          stroke={light ? '#fff' : 'url(#logo-g)'}
          strokeWidth="3.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span className={`text-xl font-semibold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
        UM MailSense
      </span>
    </span>
  )
}

/** Icon for each segment code (matches the inbox tiles in the design). */
export const SEGMENT_ICONS: Record<string, (p: IconProps) => ReactNode> = {
  UM_NOTICE: MegaphoneIcon,
  HACKATHON: TrophyIcon,
  RESEARCH: FlaskIcon,
  EVENT: CalendarIcon,
  SCHOLARSHIP_CAREER: GradCapIcon,
  CLUB: UsersIcon,
  SECURITY: KeyShieldIcon,
  NOT_FOR_ME: BanIcon,
}
