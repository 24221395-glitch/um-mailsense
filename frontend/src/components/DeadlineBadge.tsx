type DeadlineBadgeProps = {
  deadline: string
  now?: Date
}

function daysUntil(deadline: string, now: Date): number {
  const ms = new Date(deadline).getTime() - now.getTime()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

export default function DeadlineBadge({ deadline, now = new Date() }: DeadlineBadgeProps) {
  const days = daysUntil(deadline, now)
  const date = new Date(deadline).toLocaleDateString([], { day: 'numeric', month: 'short' })

  let label: string
  let style: string

  if (days < 0) {
    label = `Expired ${date}`
    style = 'bg-slate-100 text-slate-500'
  } else if (days === 0) {
    label = 'Due today'
    style = 'bg-red-100 text-red-700'
  } else if (days <= 3) {
    label = `Due ${date}`
    style = 'bg-red-100 text-red-700'
  } else if (days <= 7) {
    label = `Due ${date}`
    style = 'bg-amber-100 text-amber-700'
  } else {
    label = `Due ${date}`
    style = 'bg-slate-100 text-slate-600'
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}