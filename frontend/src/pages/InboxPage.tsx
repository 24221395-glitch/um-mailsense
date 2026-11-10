import { useMemo, useState } from 'react'
import EmailCard from '../components/EmailCard'
import SegmentTabs from '../components/SegmentTabs'
import { mockEmails } from '../mocks/emails'

const SEGMENT_LABELS: Record<string, string> = {
  UM_NOTICE: 'UM Notice',
  HACKATHON: 'Hackathon',
  RESEARCH: 'Research',
  EVENT: 'Event',
  SCHOLARSHIP_CAREER: 'Scholarship & Career',
  CLUB: 'Club',
  NOT_FOR_ME: 'Not for me',
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short' })
}

export default function InboxPage() {
  const [activeCode, setActiveCode] = useState('ALL')

  const tabs = useMemo(() => {
    const codes = Array.from(new Set(mockEmails.map((e) => e.segment)))
    return [
      { code: 'ALL', label: 'All', count: mockEmails.length },
      ...codes.map((code) => ({
        code,
        label: SEGMENT_LABELS[code] ?? code,
        count: mockEmails.filter((e) => e.segment === code).length,
      })),
    ]
  }, [])

  const visible =
    activeCode === 'ALL' ? mockEmails : mockEmails.filter((e) => e.segment === activeCode)

  const unreadCount = mockEmails.filter((e) => !e.is_read).length

  return (
    <main className="mx-auto min-h-screen max-w-md bg-slate-50 p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
        <p className="text-sm text-slate-500">{unreadCount} new emails</p>
      </header>

      <div className="mb-4">
        <SegmentTabs tabs={tabs} activeCode={activeCode} onChange={setActiveCode} />
      </div>

      <ul className="space-y-3">
        {visible.map((email) => (
          <li key={email.id}>
            <EmailCard
              id={email.id}
              senderName={email.sender_name}
              subject={email.subject}
              snippet={email.snippet}
              receivedAt={email.received_at}
              isRead={email.is_read}
              segmentLabel={SEGMENT_LABELS[email.segment] ?? email.segment}
              deadlineLabel={email.deadline ? `Due ${formatDay(email.deadline)}` : undefined}
              recommendation={email.recommendation}
            />
          </li>
        ))}
      </ul>
    </main>
  )
}