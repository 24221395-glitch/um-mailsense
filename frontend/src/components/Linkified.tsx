import { Fragment } from 'react'
import { ExternalIcon } from './icons'

// http(s)://… or www.… up to whitespace / brackets / quotes
const URL_RE = /((?:https?:\/\/|www\.)[^\s<>"'()[\]{}]+)/gi
const TRAILING = /[.,;:!?]+$/

/** Turn "www.x.com" into a full https URL; only http(s) links are ever produced. */
function toHref(raw: string): string {
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
}

/** Short label for a long link: domain + start of the path, e.g. "forms.gle/abc123…". */
export function shortUrl(raw: string, max = 42): string {
  const label = raw
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '')
  return label.length > max ? `${label.slice(0, max - 1)}…` : label
}

/** A safe, clickable link that opens in a new tab and never overflows its box. */
export function ExternalLink({
  href,
  label,
  className = '',
}: {
  href: string
  label?: string
  className?: string
}) {
  const url = toHref(href)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      title={url}
      className={`font-medium text-accent underline decoration-accent/40 underline-offset-2 [overflow-wrap:anywhere] hover:decoration-accent ${className}`}
    >
      {label ?? shortUrl(href)}
      <ExternalIcon className="ml-0.5 inline h-3.5 w-3.5 align-[-2px]" />
    </a>
  )
}

/**
 * Plain text with web links made clickable. Nothing is rendered as HTML (safe for email
 * content); long links are shortened for display and wrap instead of overflowing.
 */
export default function Linkified({ text }: { text: string }) {
  const parts = text.split(URL_RE)
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>
        const trail = part.match(TRAILING)?.[0] ?? ''
        const link = trail ? part.slice(0, -trail.length) : part
        return (
          <Fragment key={i}>
            <ExternalLink href={link} />
            {trail}
          </Fragment>
        )
      })}
    </>
  )
}
