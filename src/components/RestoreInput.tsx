import { useState, useEffect, useRef, FormEvent } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  Variants,
} from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Circle,
  ChevronLeft,
} from "lucide-react";
import clsx from "clsx";

/* =============================================================
 * OneHubDB – RestoreInput.tsx  (v5.1 — “Full Nuke + Polished”)
 * Added missing features:
 *   • Custom blinking cursor indicator (▍) when input focused.
 *   • Invalid-state shake animation on Enter with invalid DSN.
 *   • “Pinging…” interim state before RTT arrives.
 *   • Static radial vignette behind form to focus attention.
 *   • Enhanced CTA hover: slight scale + inner glow.
 *   • Basic TLS detection from DSN query params (sslmode).
 *   • “Edit DSN” back-navigation from logs phase.
 * ============================================================= */

const DSN_REGEX = /^(postgres(?:ql)?:\/\/)([^:]+):(.*)@([\w.-]+):(\d+)\/([^?]+)(\?(.+))?$/i;
// Captures:
// 1: protocol (postgres:// or postgresql://)
// 2: user
// 3: password
// 4: host
// 5: port
// 6: db name (before ?)
// 7: whole `?params` (optional)
// 8: params string (optional)
const isValidDSN = (dsn: string) => DSN_REGEX.test(dsn.trim());

type ParseResult = {
  protocol: string; // e.g. "postgresql://"
  user: string;
  host: string;
  port: string;
  db: string;
  maskedPass: string;
  tls: boolean | null; // true = SSL required/present, false = disabled, null = unknown
  paramsRaw: string | null;
} | null;

function parseDSN(dsn: string): ParseResult {
  const m = DSN_REGEX.exec(dsn.trim());
  if (!m) return null;
  const protocol = m[1];
  const user = m[2];
  const host = m[4];
  const port = m[5];
  const db = m[6];
  const paramsRaw = m[8] || null;
  // Basic TLS detection from params: look for sslmode
  let tls: boolean | null = null;
  if (paramsRaw) {
    // parse param string like "sslmode=require&other=..."
    const kvPairs = paramsRaw.split("&");
    for (const kv of kvPairs) {
      const [key, val] = kv.split("=");
      if (key.toLowerCase() === "sslmode") {
        const mode = (val || "").toLowerCase();
        if (
          mode === "disable" ||
          mode === "allow" ||
          mode === "prefer"
        ) {
          // prefer/allow may or may not encrypt; we treat prefer as unknown
          if (mode === "disable") tls = false;
          else tls = null;
        } else if (
          mode === "require" ||
          mode === "verify-ca" ||
          mode === "verify-full"
        ) {
          tls = true;
        } else {
          tls = null;
        }
      }
    }
  }
  // If no explicit sslmode, leave tls = null (unknown)
  return {
    protocol,
    user,
    host,
    port,
    db,
    maskedPass: "•".repeat(8),
    tls,
    paramsRaw,
  };
}

function useValidation(dsn: string) {
  const [state, setState] = useState<"idle" | "valid" | "invalid">(
    "idle"
  );
  useEffect(() => {
    if (!dsn) return void setState("idle");
    const id = setTimeout(
      () => setState(isValidDSN(dsn) ? "valid" : "invalid"),
      120
    );
    return () => clearTimeout(id);
  }, [dsn]);
  return state;
}

function usePing(host?: string) {
  const [rtt, setRtt] = useState<number | null>(null);
  const [pinging, setPinging] = useState(false);
  useEffect(() => {
    if (!host) return;
    let mounted = true;
    setPinging(true);
    setRtt(null);
    const img = new Image();
    const start = performance.now();
    img.onload = img.onerror = () => {
      if (!mounted) return;
      const elapsed = Math.round(performance.now() - start);
      setRtt(elapsed);
      setPinging(false);
    };
    // add a cache-buster
    img.src = `https://${host}/favicon.ico?_=${Date.now()}`;
    // timeout fallback after e.g. 3s
    const to = setTimeout(() => {
      if (mounted && rtt === null) {
        setPinging(false);
        setRtt(null);
      }
    }, 3000);
    return () => {
      mounted = false;
      clearTimeout(to);
    };
  }, [host]);
  return { rtt, pinging };
}

interface Props {
  onRunRestore: (dsn: string) => void;
  onRunDemo: () => void;
  onUploadDump: () => void; // NEW PROP
}

export default function RestoreInput({
  onRunRestore,
  onRunDemo,
  onUploadDump, // NEW PROP
}: Props) {
  const [dsn, setDsn] = useState("");
  const validation = useValidation(dsn);
  const parsed = validation === "valid" ? parseDSN(dsn) : null;
  const { rtt, pinging } = usePing(parsed?.host);

  const [phase, setPhase] = useState<"input" | "logs">("input");
  const [shakeInvalid, setShakeInvalid] = useState(false);

  // Auto-paste glow
  const [glow, setGlow] = useState(false);

  // Spotlight
  const spotX = useMotionValue(0);
  const spotY = useMotionValue(0);
  const springX = useSpring(spotX, { stiffness: 80, damping: 20 });
  const springY = useSpring(spotY, { stiffness: 80, damping: 20 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      spotX.set(e.clientX);
      spotY.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
    (async () => {
      try {
        const clip = await navigator.clipboard.readText();
        if (isValidDSN(clip)) {
          setDsn(clip.trim());
          setGlow(true);
          setTimeout(() => setGlow(false), 800);
        }
      } catch {}
    })();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validation === "valid") {
      setPhase("logs");
      onRunRestore(dsn.trim());
    } else {
      // trigger shake animation
      setShakeInvalid(true);
      setTimeout(() => setShakeInvalid(false), 500);
    }
  };

  const StatusIcon =
    validation === "valid" ? CheckCircle2 : AlertCircle;

  /* ----------------- Logs typing ----------------- */
  const LOG_LINES = [
    "$ pg_restore --dbname=$DSN --verbose",
    "[INFO] Connecting to database...",
    "[INFO] Restoring schema definitions...",
    "[INFO] Restoring table \"users\"...",
    "[INFO] Restoring table \"orders\"...",
    "[INFO] Restoring indexes...",
    "[INFO] Restore completed in 19.4 seconds",
    "[INFO] Verifying app service availability...",
    "[INFO] App service passed healthcheck ✔",
    "[DONE] Restore test finished. Nightly enabled.",
  ];
  const [emitted, setEmitted] = useState<string[]>([]);
  useEffect(() => {
    if (phase !== "logs") return;
    setEmitted([]);
    let idx = 0;
    const tick = () => {
      setEmitted((prev) => [...prev, LOG_LINES[idx]]);
      idx++;
      if (idx < LOG_LINES.length) {
        setTimeout(tick, 800);
      }
    };
    // small delay before starting logs
    setTimeout(tick, 400);
  }, [phase]);

  // Custom blinking cursor state: toggle every 500ms when focused in input phase
  const [showBlink, setShowBlink] = useState(false);
  useEffect(() => {
    if (phase !== "input") return;
    let id: NodeJS.Timeout;
    const tick = () => {
      setShowBlink((prev) => !prev);
      id = setTimeout(tick, 500);
    };
    tick();
    return () => clearTimeout(id);
  }, [phase]);

  // Radial vignette overlay: static behind form
  // We'll render a full-screen absolute <div> with CSS radial gradient
  // via inline style because Tailwind lacks built-in radial gradient utility here.

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0E1015] px-4 font-mono text-[#F5F7FA]">
      {/* Background grid */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[url('/grid.svg')] opacity-10"
        animate={{
          backgroundPositionX: ["0%", "100%"],
          backgroundPositionY: ["0%", "100%"],
        }}
        transition={{ repeat: Infinity, duration: 120, ease: "linear" }}
      />

      {/* Static radial vignette behind content */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(14,16,21,0) 0%, rgba(14,16,21,0.7) 70%)",
        }}
      />

      {/* Spotlight cursor overlay */}
      <motion.div
        style={{ pointerEvents: "none", x: springX, y: springY }}
        className="absolute h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-cobalt/10 blur-3xl"
      />

      {/* INPUT PHASE */}
      <AnimatePresence>
        {phase === "input" && (
          <motion.div
            key="input-phase"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="flex w-full flex-col items-center"
          >
            {/* Prompt */}
            <h2 className="mb-6 text-center text-xl tracking-wide text-[#8B939F]">
              Paste your Postgres DSN and press{" "}
              <span className="font-semibold text-white">Enter</span>
            </h2>

            {/* Input container with shake on invalid */}
            <motion.div
              className={clsx(
                "w-full max-w-5xl",
                shakeInvalid && "pointer-events-none"
              )}
              animate={
                shakeInvalid
                  ? {
                      x: [0, -8, 8, -6, 6, -4, 4, 0],
                    }
                  : { x: 0 }
              }
              transition={{ duration: 0.5 }}
            >
              <form onSubmit={handleSubmit}>
                <div
                  className={clsx(
                    "relative rounded-md transition-shadow",
                    glow && "shadow-[0_0_0_3px_var(--brand-green)]"
                  )}
                >
                  <input
                    ref={inputRef}
                    value={dsn}
                    onChange={(e) => setDsn(e.target.value)}
                    placeholder="postgresql://user:password@host:5432/dbname"
                    autoComplete="off"
                    className={clsx(
                      "w-full bg-transparent text-3xl leading-tight tracking-tight placeholder:text-[#454b53] outline-none",
                      "border-b-2 transition-colors duration-200 caret-white",
                      validation === "valid" &&
                        "border-brand-green focus:border-brand-green",
                      validation === "invalid" &&
                        "border-accent-red focus:border-accent-red",
                      validation === "idle" &&
                        "border-[#363b41] focus:border-brand-cobalt"
                    )}
                    aria-label="Postgres DSN"
                  />
                  {/* Custom blinking cursor indicator */}
                  {showBlink && (
                    <span
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-3xl text-[#F5F7FA]"
                      style={{
                        // approximate position: after first character or at start if empty
                        pointerEvents: "none",
                      }}
                    >
                      ▍
                    </span>
                  )}
                  <AnimatePresence>
                    {validation !== "idle" && (
                      <motion.span
                        key={validation}
                        className="absolute right-0 top-1/2 -translate-y-1/2"
                        initial={{ opacity: 0, scale: 0.75 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.75 }}
                        transition={{ duration: 0.2 }}
                      >
                        <StatusIcon
                          size={20}
                          className={
                            validation === "valid"
                              ? "text-brand-green"
                              : "text-accent-red"
                          }
                        />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </form>
            </motion.div>

            {/* Parsed DSN */}
            {parsed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.85, y: 0 }}
                className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm text-[#8B939F]"
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Protocol:{" "}
                  <span className="text-white">
                    {parsed.protocol.replace("://", "")}
                  </span>
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 }}
                >
                  User: <span className="text-white">{parsed.user}</span>
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  Password: <span className="text-white">{parsed.maskedPass}</span>
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  Host: <span className="text-white">{parsed.host}</span>
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Port: <span className="text-white">{parsed.port}</span>
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  DB: <span className="text-white">{parsed.db}</span>
                </motion.span>
                {pinging ? (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    | Pinging… <span className="inline-block animate-pulse">●</span>
                  </motion.span>
                ) : rtt !== null ? (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    | RTT:{" "}
                    <span
                      className={clsx(
                        "font-semibold",
                        rtt < 80 && "text-brand-green",
                        rtt >= 80 && rtt < 200 && "text-[#e5e56e]",
                        rtt >= 200 && "text-accent-red"
                      )}
                    >
                      {rtt} ms
                    </span>
                  </motion.span>
                ) : null}
              </motion.div>
            )}

            {/* Contextual trust hints */}
            {parsed && (
              <motion.div
                className="mt-2 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
              >
                {/* Port hint */}
                <span className={parsed.port === "5432" ? "text-brand-green" : "text-[#e5e56e]"}>
                  {parsed.port === "5432"
                    ? "Standard Postgres port detected."
                    : "Non-standard port."}
                </span>
                {/* TLS hint */}
                {"  "}
                {parsed.tls === true && (
                  <span className="text-brand-green">TLS required ✓</span>
                )}
                {parsed.tls === false && (
                  <span className="text-accent-red">TLS disabled ⚠️</span>
                )}
                {parsed.tls === null && (
                  <span className="text-[#8B939F]">TLS unknown</span>
                )}
                {/* Show raw params if present */}
                {parsed.paramsRaw && (
                  <span className="text-[#6E7580]">
                    {" "}
                    (params: {parsed.paramsRaw})
                  </span>
                )}
              </motion.div>
            )}

            {/* Divider & Demo CTA */}
            <div className="mt-14 flex flex-col items-center gap-4 text-xs uppercase tracking-wider text-[#6E7580]">
              <div className="flex items-center gap-4">
                <span className="h-px w-24 bg-[#363b41]" />
                <span>or</span>
                <span className="h-px w-24 bg-[#363b41]" />
              </div>
              <button
                type="button"
                onClick={onUploadDump} // CHANGED
                className="group relative inline-block rounded-md bg-transparent px-8 py-3 text-base font-medium text-[#F5F7FA] transition-transform duration-150 ease-out hover:scale-105 focus:scale-105"
              >
                <span className="relative z-10">Upload .dump file</span>
                {/* Inner glow on hover */}
                <span className="absolute inset-0 rounded-md opacity-0 bg-brand-cobalt/20 transition-opacity duration-150 ease-out group-hover:opacity-30" />
                <span className="block h-px w-0 bg-brand-cobalt transition-all duration-300 group-hover:w-full"></span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOG PHASE */}
      <AnimatePresence>
        {phase === "logs" && (
          <motion.div
            key="logs-phase"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-5xl px-4 flex flex-col"
          >
            {/* Back button */}
            <button
              onClick={() => {
                setPhase("input");
                // refocus input
                setTimeout(() => {
                  inputRef.current?.focus();
                }, 100);
              }}
              className="flex items-center text-sm text-[#8B939F] hover:text-white mb-2"
            >
              <ChevronLeft size={16} className="mr-1" />
              Edit DSN
            </button>

            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[#C0C8D0]">
              {emitted.join("\n")}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
