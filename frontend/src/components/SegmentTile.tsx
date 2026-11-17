import { segmentColor, segmentLabel } from '../segments'
import { SEGMENT_ICONS } from './icons'

type Props = {
  code: string
  newCount: number
  active?: boolean
  onClick: () => void
}

/** Colourful segment tile ("UM Notice · 6 new") from the UI design. */
export default function SegmentTile({ code, newCount, active = false, onClick }: Props) {
  const Ico = SEGMENT_ICONS[code]
  const { fg, bg } = segmentColor(code)
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`card card-hover flex flex-col items-center px-2 py-4 text-center ${
        active ? 'ring-2 ring-accent' : ''
      }`}
      style={{ background: active ? bg : undefined }}
    >
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: bg, color: fg }}
      >
        <Ico className="h-6 w-6" />
      </span>
      <span className="mt-2 text-sm font-semibold leading-tight text-ink">
        {segmentLabel(code)}
      </span>
      <span className="mt-0.5 text-xs font-medium" style={{ color: fg }}>
        {newCount} new
      </span>
    </button>
  )
}
