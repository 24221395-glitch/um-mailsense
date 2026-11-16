// The 7 segment codes from ai/mailsense_ai/contracts.py, with display labels.
export const SEGMENT_LABELS: Record<string, string> = {
  UM_NOTICE: 'UM Notice',
  HACKATHON: 'Hackathon',
  RESEARCH: 'Research',
  EVENT: 'Event',
  SCHOLARSHIP_CAREER: 'Scholarship & Career',
  CLUB: 'Club',
  NOT_FOR_ME: 'Not for me',
}

export const SEGMENT_ORDER = Object.keys(SEGMENT_LABELS)

export const UNSORTED = 'UNSORTED'

export function segmentLabel(code: string | null): string {
  if (!code) return 'Sorting…'
  return SEGMENT_LABELS[code] ?? code
}
