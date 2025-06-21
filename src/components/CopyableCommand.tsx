import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clipboard, Check } from "lucide-react";
// Optional sound. Place /public/sounds/copy.mp3 or silence fallback.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – library is optional during build
import useSound from "use-sound";

interface CopyableCommandProps {
  command?: string;
  className?: string;
}

export default function CopyableCommand({
  command = "curl -sSL onehub.sh | bash",
  className = "",
}: CopyableCommandProps) {
  const [copyCount, setCopyCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [beamKey, setBeamKey] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const lastClick = useRef<number>(0);

  const [playClick] = (() => {
    try {
      return useSound("/sounds/copy.mp3", { volume: 0.3 });
    } catch {
      return [() => {}];
    }
  })();

  const handleCopy = useCallback(() => {
    const now = Date.now();
    if (now - lastClick.current < 250) return;
    lastClick.current = now;

    navigator.clipboard
      .writeText(command)
      .then(() => {
        playClick?.();
        setCopyError(false);
        setCopyCount((c) => c + 1);
        setCopied(true);
        setShowPreview(true);
        setBeamKey((k) => k + 1);
        if (!unlocked) setUnlocked(true);
        setTimeout(() => setShowPreview(false), 800);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        setCopyError(true);
        setCopied(false);
        setShowPreview(false);
        setTimeout(() => setCopyError(false), 2000);
      });
  }, [command, playClick, unlocked]);

  return (
    <div className="relative w-fit">
      <div
        onClick={handleCopy}
        className={`relative inline-flex items-center font-mono text-[clamp(1rem,4vw,1.6rem)] select-none cursor-pointer ${className}`}
      >
        <span className="text-text-secondary mr-1">$</span>
        <span>{command}</span>

        <motion.span
          className="ml-2 text-text-secondary"
          initial={false}
          animate={copied ? { rotateY: 180 } : { rotateY: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        >
          {copied ? <Check size={20} /> : <Clipboard size={20} />}
        </motion.span>

        <AnimatePresence>
          <motion.span
            key={beamKey}
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-white/40 blur-sm"
          />
        </AnimatePresence>

        <AnimatePresence>
          {copied && (
            <motion.span
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 1.4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 rounded-full bg-blue-500/20 blur-2xl"
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {unlocked && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 0.8, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mt-2 text-sm text-green-400 font-mono select-none"
          >
            ✅ Demo DB ready — Press ⏎ to run test
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
