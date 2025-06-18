import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const chunks = ['$', ' ', 'curl', ' ', '-sSL', ' ', 'onehub', '.', 'sh', ' ', '|', ' ', 'bash']
const fullCommand = chunks.join('')

export function Hero() {
  const [typed, setTyped] = useState('')
  const [done, setDone] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const skip = useRef(false)
  const timer = useRef<NodeJS.Timeout | null>(null)

  const finish = () => {
    if (skip.current) return
    skip.current = true
    if (timer.current) clearTimeout(timer.current)
    setTyped(fullCommand)
    setDone(true)
    setShowHint(true)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => ['Enter', ' ', 'Escape'].includes(e.key) && finish()
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.onehub-terminal')) finish()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('click', onClick)
    }
  }, [])

  useEffect(() => {
    let i = 0
    const jitter = () => 100 + (Math.random() - 0.5) * 40
    const run = () => {
      if (skip.current) return
      if (i >= fullCommand.length) {
        setDone(true)
        timer.current = setTimeout(() => setShowHint(true), 400)
        return
      }
      setTyped(fullCommand.slice(0, i + 1))
      i++
      timer.current = setTimeout(() => requestAnimationFrame(run), jitter())
    }
    timer.current = setTimeout(() => requestAnimationFrame(run), 600)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (
    <section
      tabIndex={0}
      className="relative h-screen flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--text-primary)] overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"
        initial={{ scale: 1.2 }}
        animate={done ? { scale: 1, opacity: 0.15 } : undefined}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      <div className={clsx(
        "onehub-terminal z-10 font-mono font-bold whitespace-nowrap leading-none text-[clamp(1.7rem,5vw,4.2rem)]",
        done && 'glow-finish'
      )}>
        {typed}
        <span className={clsx(done ? 'animate-blink' : '')}>▌</span>
      </div>

      {/* ✅ Updated Hint block as button */}
      <div className="h-6 mt-6 text-sm font-mono text-[var(--text-secondary)]">
        {showHint && (
          <motion.button
            type="button"
            onClick={() => console.log('restore triggered')} // update as needed
            className="inline-flex items-center gap-2 cursor-pointer transition-transform duration-300 ease-out hover:-translate-y-0.5 focus:outline-none"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="font-semibold text-[var(--text-primary)]">⏎</span>
            <span>to run the restore test</span>
          </motion.button>
        )}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1 }
          50% { opacity: 0 }
        }
        .animate-blink {
          animation: blink 1s linear infinite;
        }
        .glow-finish {
          text-shadow: 0 0 4px var(--accent-green), 0 0 8px var(--accent-green);
          transition: text-shadow 0.3s ease;
        }
      `}</style>
    </section>
  )
}
