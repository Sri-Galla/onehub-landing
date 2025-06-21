import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import useSound from "use-sound"; // yarn add use-sound

/* =========================================================================
 *  OneHubDB • Hero v2.0
 *  Copy-interaction: tooltip, scan-beam, aura, sound, icon-flip, dynamic text
 * ========================================================================= */

const chunks = ["$", " ", "curl", " ", "-sSL", " ", "onehub", ".", "sh", " ", "|", " ", "bash"];
const fullCommand = chunks.join("");
const copyableCommand = fullCommand.replace(/^\$\s*/, ""); // strip "$ "

enum Step {
  Blank,
  Grid,
  Line1,
  Line2,
  Blink,
  Typing,
  CTA,
  Glow, // command fully visible & copyable
}

const T = {
  grid: 300,
  line1: 1000,
  line2: 1500,
  blink: 1000,
  typingStart: 600,
  ctaDelay: 400,
};

export default function Hero({ onEnter }: { onEnter: () => void }) {
  const [step, setStep] = useState<Step>(Step.Blank);
  const [typed, setTyped] = useState("");
  const timers = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const seq = useCallback((delay: number, next: Step) => {
    timers.current.push(setTimeout(() => setStep(next), delay));
  }, []);

  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipText, setTooltipText] = useState("Click to copy");
  const [copyCount, setCopyCount] = useState(0);
  const [iconCopied, setIconCopied] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [auraActive, setAuraActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [playCopy] = useSound("/copy.mp3", { volume: 0.3 });

  const finish = useCallback(() => {
    clearTimers();
    setTyped(fullCommand);
    setStep(Step.Glow);
  }, [clearTimers]);

  useEffect(() => {
    seq(T.grid, Step.Grid);
    seq(T.grid + T.line1, Step.Line1);
    seq(T.grid + T.line1 + T.line2, Step.Line2);
    seq(T.grid + T.line1 + T.line2 + T.blink, Step.Blink);
    seq(T.grid + T.line1 + T.line2 + T.blink + T.typingStart, Step.Typing);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        finish();
        onEnter();
      }
      if (e.key === "Escape") finish();
    };

    window.addEventListener("keydown", onKey);
    return () => {
      clearTimers();
      window.removeEventListener("keydown", onKey);
    };
  }, [finish, onEnter, seq, clearTimers]);

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
  }, [step, seq]);

  useEffect(() => {
    const handleClick = () => {
      if (step < Step.Glow && step >= Step.Line1) finish();
    };
    if (step >= Step.Line1 && step < Step.Glow) {
      window.addEventListener("click", handleClick);
    }
    return () => window.removeEventListener("click", handleClick);
  }, [step, finish]);

  const handleCopy = () => {
    navigator.clipboard.writeText(copyableCommand).catch(() => {});
    playCopy();
    setCopyCount((c) => c + 1);

    setTooltipText(
      copyCount === 0
        ? "Copied. You’re ready."
        : copyCount === 1
        ? "Copied again — still ready."
        : "Getting paranoid? Still copied."
    );

    setIconCopied(true);
    setScanActive(true);
    setAuraActive(true);
    setShowPreview(true);

    setTimeout(() => {
      setIconCopied(false);
      setTooltipText("Click to copy");
      setShowPreview(false);
    }, 1500);

    setTimeout(() => {
      setScanActive(false);
      setAuraActive(false);
    }, 450);
  };

  const showTooltip = () => setTooltipOpen(true);
  const hideTooltip = () => {
    if (!iconCopied) setTooltipOpen(false);
  };

  return (
    <section
      tabIndex={0}
      className="relative flex h-screen flex-col items-center justify-center overflow-hidden bg-background text-text-primary"
    >
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

      {auraActive && (
        <motion.div
          className="pointer-events-none absolute top-[calc(50%-28px)] left-1/2 -translate-x-1/2 h-24 w-[calc(811px+8rem)] rounded-lg bg-white/5 blur-2xl"
          initial={{ scale: 0, opacity: 0.3 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      )}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+96px)] w-[811px] h-[220px] select-none">
        {step >= Step.Line1 && (
          <motion.p
            className="absolute top-0 left-0 w-full text-center font-mono font-semibold text-[48px] leading-[64px] text-text-secondary"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.45, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            You think you have backups?
          </motion.p>
        )}
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

        {step >= Step.Typing && (
          <motion.pre
            className={clsx(
              "onehub-terminal relative absolute top-[136px] left-0 w-full text-center font-mono font-bold whitespace-nowrap",
              "text-[clamp(1.4rem,4.2vw,3.1rem)]"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onClick={() => {
              if (step < Step.Glow) {
                finish();
              } else {
                handleCopy();
                setTooltipOpen(true);
              }
            }}
            style={{ cursor: step >= Step.Glow ? "pointer" : "default" }}
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
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                aria-label="Copy command"
                className="absolute right-0 -top-4 p-1 text-text-secondary hover:text-white"
                style={{
                  perspective: 600,
                  width: 28,
                  height: 28,
                }}
                whileHover={{ scale: 1.2 }}
              >
                <motion.div
                  initial={false}
                  animate={{
                    rotateY: iconCopied ? 180 : 0,
                    scale: iconCopied ? 1 : 0.95,
                  }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  style={{
                    transformStyle: "preserve-3d",
                    width: "100%",
                    height: "100%",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      backfaceVisibility: "hidden",
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CopyIcon className="w-6 h-6" />
                  </div>
                  <div
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckIcon className="w-6 h-6" />
                  </div>
                </motion.div>
              </motion.button>
            )}
            <AnimatePresence>
              {scanActive && (
                <motion.span
                  className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>
          </motion.pre>
        )}

        {step >= Step.CTA && (
          <motion.button
            type="button"
            onClick={onEnter}
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

      <style>
        {`
          @keyframes blink { 0%,100% {opacity:1} 50% {opacity:0} }
          .animate-blink { animation: blink 1s step-end infinite; }
        `}
      </style>
    </section>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CopyIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}
