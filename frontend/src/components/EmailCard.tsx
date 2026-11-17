import { segmentColor } from '../segments'
import { MailIcon, SEGMENT_ICONS } from './icons'

type EmailCardProps = {
  id: number
  senderName: string
  subject: string
  snippet: string
  receivedAt: string
  isRead: boolean
  segmentCode?: string | null
  segmentLabel: string
  deadlineLabel?: string
  recommendation?: 'for_you' | 'not_for_you' | null
  recommendationReason?: string
  isOfficial?: boolean
  onClick?: (id: number) => void
}

export default function EmailCard({
  id,
  senderName,
  subject,
  snippet,
  receivedAt,
  isRead,
  segmentCode = null,
  segmentLabel,
  deadlineLabel,
  recommendation,
  recommendationReason,
  isOfficial = false,
  onClick,
}: EmailCardProps) {
  const time = new Date(receivedAt).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  const { fg, bg } = segmentColor(segmentCode)
  const Ico = SEGMENT_ICONS[segmentCode ?? ''] ?? MailIcon

  return (
    <button
      type="button"
      onClick={() => onClick?.(id)}
      className={`card card-hover w-full p-4 text-left ${isOfficial ? 'border-l-4' : ''}`}
      style={isOfficial ? { borderLeftColor: fg } : undefined}
    >
      <div className="flex items-start gap-4">
        <span
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: bg, color: fg }}
        >
          <Ico className="h-5 w-5" />
          {!isRead && (
            <span
              className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-accent ring-2 ring-surface"
              aria-label="Unread"
            />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`truncate text-sm ${isRead ? 'font-medium' : 'font-semibold'} text-ink`}
            >
              {senderName}
            </span>
            <time className="shrink-0 text-xs text-faint">{time}</time>
          </div>
          <p className={`mt-0.5 truncate ${isRead ? 'font-medium' : 'font-semibold'} text-ink`}>
            {subject}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{snippet}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: bg, color: fg }}
            >
              {segmentLabel}
            </span>
            {recommendation === 'for_you' && (
              <span
                title={recommendationReason}
                className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success"
              >
                ★ For you
              </span>
            )}
            {deadlineLabel && (
              <span className="ml-auto rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger">
                {deadlineLabel}
              </span>
            )}
          </div>
          {recommendation === 'for_you' && recommendationReason && (
            <p className="mt-2 text-xs text-success">{recommendationReason}</p>
          )}
        </div>
      </div>
    </button>
  )
}
