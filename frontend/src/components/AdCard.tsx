type AdCardProps = {
  id: number
  title: string
  organisationName: string
  description?: string
  category: string
  imageUrl?: string | null
  eventDate?: string | null
  isSaved: boolean
  recommendation?: 'for_you' | 'not_for_you' | null
  onToggleSave?: (id: number) => void
  onClick?: (id: number) => void
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export default function AdCard({
  id,
  title,
  organisationName,
  category,
  imageUrl,
  eventDate,
  isSaved,
  recommendation,
  onToggleSave,
  onClick,
}: AdCardProps) {
  const dateText = eventDate
    ? new Date(eventDate).toLocaleString([], {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={() => onClick?.(id)} className="block w-full text-left">
        <div className="flex h-32 items-center justify-center bg-blue-50">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-semibold text-blue-600">{initials(organisationName)}</span>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {organisationName}
            {dateText && ` · ${dateText}`}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {category}
            </span>
            {recommendation === 'for_you' && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                For you
              </span>
            )}
          </div>
        </div>
      </button>
      <div className="flex justify-end px-4 pb-3">
        <button
          type="button"
          onClick={() => onToggleSave?.(id)}
          aria-pressed={isSaved}
          aria-label={isSaved ? 'Unsave' : 'Save'}
          className={`text-xl leading-none ${isSaved ? 'text-red-500' : 'text-slate-300 hover:text-red-400'}`}
        >
          {isSaved ? '♥' : '♡'}
        </button>
      </div>
    </article>
  )
}