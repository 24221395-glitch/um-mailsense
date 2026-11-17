// The 8 segment codes from ai/mailsense_ai/contracts.py, with labels and theme colours.
export const SEGMENT_LABELS: Record<string, string> = {
  UM_NOTICE: 'UM Notice',
  HACKATHON: 'Hackathon',
  RESEARCH: 'Research',
  EVENT: 'Events',
  SCHOLARSHIP_CAREER: 'Scholarships',
  CLUB: 'Club & Community',
  SECURITY: 'Security',
  NOT_FOR_ME: 'Not for me',
}

export const SEGMENT_ORDER = Object.keys(SEGMENT_LABELS)

/** Segments shown as tiles (everything except "Not for me"). */
export const TILE_SEGMENTS = SEGMENT_ORDER.filter((c) => c !== 'NOT_FOR_ME')

/** Icon colour and soft tile background for each segment (from the UI design). */
export const SEGMENT_COLORS: Record<string, { fg: string; bg: string }> = {
  UM_NOTICE: { fg: '#f0436b', bg: 'rgba(240, 67, 107, 0.10)' },
  HACKATHON: { fg: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  RESEARCH: { fg: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.11)' },
  EVENT: { fg: '#3b82f6', bg: 'rgba(59, 130, 246, 0.11)' },
  SCHOLARSHIP_CAREER: { fg: '#10b981', bg: 'rgba(16, 185, 129, 0.11)' },
  CLUB: { fg: '#6366f1', bg: 'rgba(99, 102, 241, 0.11)' },
  SECURITY: { fg: '#0ea5a4', bg: 'rgba(14, 165, 164, 0.11)' },
  NOT_FOR_ME: { fg: '#8a86a8', bg: 'rgba(138, 134, 168, 0.12)' },
}

export function segmentColor(code: string | null) {
  return SEGMENT_COLORS[code ?? ''] ?? { fg: 'var(--accent)', bg: 'var(--accent-soft)' }
}

export const UNSORTED = 'UNSORTED'

export function segmentLabel(code: string | null): string {
  if (!code) return 'Sorting…'
  return SEGMENT_LABELS[code] ?? code
}
