import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  /** Design size of the scene in px; children are positioned inside this box. */
  width: number
  height: number
  /** Never scale above this (keeps the scene crisp on very wide screens). */
  maxScale?: number
  className?: string
  children: ReactNode
}

/**
 * Lays out its children on a fixed design canvas and scales the whole canvas to the
 * available width, so a composed scene (robot + floating cards) keeps the same arrangement
 * on phones, tablets and desktops — like a picture, but still sharp HTML/SVG.
 */
export default function ScaledStage({
  width,
  height,
  maxScale = 1.15,
  className = '',
  children,
}: Props) {
  const outer = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = outer.current
    if (!el) return
    const update = () => setScale(Math.min(maxScale, el.clientWidth / width))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [width, maxScale])

  return (
    <div ref={outer} className={`relative w-full ${className}`} style={{ height: height * scale }}>
      <div
        className="absolute left-1/2 top-0 origin-top"
        style={{ width, height, transform: `translateX(-50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  )
}
