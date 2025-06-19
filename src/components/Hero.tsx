import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

/* =========================================================================
 *  OneHubDB • Hero v1.1 (Figma‑accurate)
 *  Doubt ➜ Challenge ➜ Prompt ➜ One‑liner ➜ CTA
 *  All elements are absolutely positioned inside a fixed 811×84 container so
 *  nothing shifts vertically. Escape / Enter / click outside = instant skip.
 * ========================================================================= */

// -------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------
const chunks = ["$", " ", "curl", " ", "-sSL", " ", "onehub", ".", "sh", " ", "|", " ", "bash"];
const fullCommand = chunks.join("");

enum Step {
  Blank,
  Grid,
  Line1,
  Line2,
  Blink,
  Typing,
  CTA,
  Glow,
}

// Fine‑tuned timing (ms)
const T = {
  grid: 300,
  line1: 1000,
  line2: 1500,
  blink: 1000,
  typingStart: 600,
  ctaDelay: 400,
};

export default function Hero() {
  const [step, setStep] = useState<Step>(Step.Blank);
  const [typed, setTyped] = useState("");
  const timers = useRef<NodeJS.Timeout[]>([]);

  const seq = (delay: number, next: Step) => {
    timers.current.push(setTimeout(() => setStep(next), delay));
  };

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    seq(T.grid, Step.Grid);
    seq(T.grid + T.line1, Step.Line1);
    seq(T.grid + T.line1 + T.line2, Step.Line2);
    seq(T.grid + T.line1 + T.line2 + T.blink, Step.Blink);
    seq(T.grid + T.line1 + T.line2 + T.blink + T.typingStart, Step.Typing);

    const finish = () => {
      clearTimers();
      setTyped(fullCommand);
      setStep(Step.Glow);
    };

    const onKey = (e: KeyboardEvent) => ["Escape", "Enter"].includes(e.key) && finish();
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".onehub-terminal")) finish();
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      clearTimers();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    if (step !== Step.Typing) return;

    let i = 0;
    const jitter = () => 100 + (Math.random() - 0.5) * 40;

    const run = () => {
      if (i >= fullCommand.length) {
        setStep(Step.CTA);
        seq(T.ctaDelay, Step.Glow);
        return;
      }
      setTyped(fullCommand.slice(0, i + 1));
      i++;
      timers.current.push(setTimeout(() => requestAnimationFrame(run), jitter()));
    };

    setTyped("$ ");
    i = 2;
    timers.current.push(setTimeout(() => requestAnimationFrame(run), 200));
  }, [step]);

  const copyCommand = () => {
    navigator.clipboard.writeText(fullCommand).catch(() => {});
  };

  return (
    <section
      tabIndex={0}
      className="relative flex h-screen flex-col items-center justify-center overflow-hidden bg-background text-text-primary"
    >
      {/* Grid background */}
      <AnimatePresence>
        {step >= Step.Grid && (
          <motion.div
            className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+96px)] w-[811px] h-[180px] select-none">
        {/* Line 1 */}
        {step >= Step.Line1 && (
          <motion.p
            className="absolute top-[0px] left-0 w-full text-center font-mono font-semibold text-[48px] leading-[64px] text-text-secondary"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.45, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            You think you have backups?
          </motion.p>
        )}

        {/* Line 2 */}
        {step >= Step.Line2 && (
          <motion.p
            className="absolute top-[64px] left-0 w-full text-center font-mono font-bold text-[48px] leading-[64px] text-text-secondary"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.45, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            Try restoring.
          </motion.p>
        )}

        {/* One-liner */}
        {step >= Step.Typing && (
          <motion.pre
            className="onehub-terminal relative absolute top-[136px] left-0 w-full text-center font-mono font-bold text-[clamp(1.4rem,4.2vw,3.1rem)] whitespace-nowrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {typed}
            {step >= Step.Line1 && step < Step.Glow && (
  <motion.span
    className="animate-blink inline-block"
    initial={{ opacity: 1 }}
    animate={{ opacity: [1, 0, 1, 0, 1] }}
    transition={{
      duration: 2,
      ease: "easeInOut",
      times: [0, 0.25, 0.5, 0.75, 1],
      repeat: Infinity,
    }}
  >
    ▌
  </motion.span>
)}


            {step === Step.Glow && (
              <button
                aria-label="Copy command"
                onClick={copyCommand}
                className="absolute right-0 -top-4 p-1 text-text-secondary hover:text-white transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide-copy"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              </button>
            )}
          </motion.pre>
        )}

        {/* CTA */}
        {step >= Step.CTA && (
          <motion.button
            type="button"
            onClick={() => console.log("restore triggered")}
            className="absolute top-[224px] left-0 mx-auto flex w-full items-center justify-center gap-2 font-mono text-base text-text-secondary transition-transform duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="text-xl">⏎</span>
            <span>
              Press <span className="font-semibold">Enter</span> to run the restore test
            </span>
          </motion.button>
        )}
      </div>

      {/* Blink animation */}
      <style>
        {`
        @keyframes blink {
          0%, 100% { opacity: 1 }
          50% { opacity: 0 }
        }
        .animate-blink { animation: blink 1s step-end infinite; }
      `}
      </style>
    </section>
  );
}
