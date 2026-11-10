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
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        {!isRead && (
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-label="Unread" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={`truncate text-sm ${isRead ? 'font-medium' : 'font-semibold'} text-slate-900`}>
              {senderName}
            </span>
            <time className="shrink-0 text-xs text-slate-500">{time}</time>
          </div>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">{subject}</p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{snippet}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {segmentLabel}
            </span>
            {recommendation === 'for_you' && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                For you
              </span>
            )}
            {deadlineLabel && (
              <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                {deadlineLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}