type Tab = {
  code: string
  label: string
  count?: number
}

type SegmentTabsProps = {
  tabs: Tab[]
  activeCode: string
  onChange: (code: string) => void
}

export default function SegmentTabs({ tabs, activeCode, onChange }: SegmentTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
      {tabs.map((tab) => {
        const active = tab.code === activeCode
        return (
          <button
            key={tab.code}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.code)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-accent text-on-accent'
                : 'border border-line bg-surface text-muted hover:bg-surface-2'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1.5 text-xs ${active ? 'text-on-accent/70' : 'text-faint'}`}>
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
