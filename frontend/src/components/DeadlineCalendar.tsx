import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { segmentLabel } from '../segments'
import type { CalendarItem } from '../types/api'
import DeadlineBadge from './DeadlineBadge'

type Props = {
  items: CalendarItem[]
  month: Date // any day in the month to show
  onMonthChange: (month: Date) => void
  now: Date
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function itemLink(item: CalendarItem): string {
  return item.kind === 'email' ? `/emails/${item.id}` : '/board'
}

/** Month view of deadlines and event dates, plus the list for the selected day (FR-34). */
export default function DeadlineCalendar({ items, month, onMonthChange, now }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const item of items) {
      const key = dayKey(new Date(item.date))
      map.set(key, [...(map.get(key) ?? []), item])
    }
    return map
  }, [items])

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const offset = (first.getDay() + 6) % 7 // weeks start on Monday
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from(
        { length: days },
        (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1),
      ),
    ]
  }, [month])

  const todayKey = dayKey(now)
  const shown = selected
    ? (byDay.get(selected) ?? [])
    : items.filter((i) => new Date(i.date) >= new Date(now.getTime() - 24 * 3600 * 1000))

  function shift(delta: number) {
    setSelected(null)
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1))
  }

  return (
    <div>
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="rounded-full px-3 py-1 text-slate-500 hover:bg-slate-100"
          >
            ‹
          </button>
          <h2 className="font-semibold text-slate-900">
            {month.toLocaleDateString([], { month: 'long', year: 'numeric' })}
          </h2>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Next month"
            className="rounded-full px-3 py-1 text-slate-500 hover:bg-slate-100"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 font-medium text-slate-400">
              {d}
            </div>
          ))}
          {cells.map((date, i) => {
            if (!date) return <div key={`blank-${i}`} />
            const key = dayKey(date)
            const dayItems = byDay.get(key) ?? []
            const hasDeadline = dayItems.some((it) => it.date_type === 'deadline')
            const isSelected = key === selected
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(isSelected ? null : key)}
                aria-label={`${date.toDateString()}, ${dayItems.length} items`}
                aria-pressed={isSelected}
                className={`flex h-10 flex-col items-center justify-center rounded-lg text-sm ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : key === todayKey
                      ? 'bg-blue-50 font-semibold text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {date.getDate()}
                {dayItems.length > 0 && (
                  <span
                    className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                      isSelected ? 'bg-white' : hasDeadline ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>
        <p className="mt-2 flex gap-4 text-xs text-slate-400">
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" />
            Deadline
          </span>
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-500" />
            Event
          </span>
        </p>
      </div>

      <h3 className="mb-2 mt-4 text-sm font-semibold text-slate-700">
        {selected ? 'On this day' : 'Coming up'}
      </h3>
      {shown.length === 0 ? (
        <p className="text-sm text-slate-400">Nothing here.</p>
      ) : (
        <ul className="space-y-2">
          {shown.map((item) => (
            <li key={`${item.kind}-${item.id}-${item.date_type}`}>
              <Link
                to={itemLink(item)}
                className="block rounded-xl border border-slate-200 bg-white p-3 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium text-slate-900">
                    {item.title}
                  </p>
                  {item.date_type === 'deadline' ? (
                    <DeadlineBadge deadline={item.date} now={now} />
                  ) : (
                    <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700">
                      {new Date(item.date).toLocaleDateString([], {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {item.date_type === 'deadline' ? 'Deadline' : 'Event'} · {item.source}
                  {item.segment && ` · ${segmentLabel(item.segment)}`}
                  {item.kind === 'ad' && ' · saved post'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
