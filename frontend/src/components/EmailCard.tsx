type EmailCardProps = {
  id: number
  senderName: string
  subject: string
  snippet: string
  receivedAt: string
  isRead: boolean
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
  segmentLabel,
  deadlineLabel,
  recommendation,
  recommendationReason,
  isOfficial = false,
  onClick,
}: EmailCardProps) {
  const time = new Date(receivedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <button
      type="button"
      onClick={() => onClick?.(id)}
      className={`w-full rounded-2xl border bg-surface p-4 text-left shadow-none hover:border-line-strong ${
        isOfficial ? 'border-line-strong border-l-4 border-l-accent' : 'border-line'
      }`}
    >
      <div className="flex items-start gap-3">
        {!isRead && (
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`truncate text-sm ${isRead ? 'font-medium' : 'font-semibold'} text-ink`}
            >
              {senderName}
            </span>
            <time className="shrink-0 text-xs text-muted">{time}</time>
          </div>
          <p className="mt-1 truncate text-sm font-semibold text-ink">{subject}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted">{snippet}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isOfficial ? 'bg-warn-soft text-warn' : 'bg-accent-soft text-accent'
              }`}
            >
              {segmentLabel}
            </span>
            {recommendation === 'for_you' && (
              <span
                title={recommendationReason}
                className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success"
              >
                For you
              </span>
            )}
            {deadlineLabel && (
              <span className="ml-auto rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-medium text-warn">
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
