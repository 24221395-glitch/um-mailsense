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
                ? 'bg-blue-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1.5 text-xs ${active ? 'text-blue-100' : 'text-slate-400'}`}>
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}