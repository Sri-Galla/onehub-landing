import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

const LOG_COLOR_RULES = [
  { regex: /Trust Level: (SUCCESS)/, className: "text-brand-green font-bold" },
  { regex: /Trust Level: (DANGEROUS)/, className: "text-[#e5e56e] font-bold" },
  { regex: /Trust Level: (FAIL)/, className: "text-accent-red font-bold" },
  { regex: /error|fail|❌/i, className: "text-accent-red" },
  { regex: /warning|warn/i, className: "text-[#e5e56e]" },
  { regex: /restored|success|metrics|objects_restored|rows_restored/i, className: "text-brand-green" },
  { regex: /risk|danger/i, className: "text-[#e5e56e]" },
];

function colorizeLogLine(line: string) {
  for (const rule of LOG_COLOR_RULES) {
    if (rule.regex.test(line)) {
      return <span className={rule.className}>{line}</span>;
    }
  }
  return <span>{line}</span>;
}

interface DumpUploadProps {
  onBack: () => void;
}

export default function DumpUpload({ onBack }: DumpUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<{ trust_level: string; output: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLPreElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
      setError(null);
      setLogs([]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
      setLogs([]);
    }
  };

  const handleRestore = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setLogs([]);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setResult(data);
      setLogs(data.output.split(/\r?\n/));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll logs
  React.useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

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
      <AnimatePresence>
        <motion.div
          key="upload-phase"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5 }}
          className="flex w-full flex-col items-center"
        >
          <h2 className="mb-6 text-center text-xl tracking-wide text-[#8B939F]">
            Upload your <span className="text-white font-semibold">.dump</span> file
          </h2>
          <div
            className={clsx(
              "w-full max-w-md flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 transition-colors duration-200 cursor-pointer",
              dragActive ? "border-brand-cobalt bg-brand-cobalt/10" : "border-[#363b41] bg-panel"
            )}
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            tabIndex={0}
            role="button"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".dump"
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <span className="text-lg text-brand-green font-semibold">{file.name}</span>
            ) : (
              <span className="text-lg text-[#8B939F]">Drag & drop or click to select a .dump file</span>
            )}
          </div>
          <div className="mt-8 flex flex-row gap-4">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-[#8B939F] hover:text-white flex items-center gap-1 border border-transparent hover:border-[#363b41] rounded px-4 py-2"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleRestore}
              disabled={!file || loading}
              className={clsx(
                "text-sm font-semibold flex items-center gap-1 px-4 py-2 rounded border transition-colors",
                !file || loading
                  ? "bg-[#22262c] text-[#6E7580] border-[#363b41] cursor-not-allowed"
                  : "bg-brand-cobalt text-white border-brand-cobalt hover:bg-action-hover hover:border-action-hover"
              )}
            >
              {loading ? "Running..." : "Run Restore"}
            </button>
          </div>
          {error && <div className="mt-4 text-accent-red">{error}</div>}
          {(logs.length > 0 || result) && (
            <div className="mt-8 w-full max-w-4xl bg-panel/80 rounded-lg p-6 shadow-lg flex flex-col items-center mx-auto">
              <h3 className="text-lg font-bold mb-2 text-brand-cobalt">Restore Result</h3>
              {result && (
                <div className={clsx(
                  "mb-2 text-base font-mono",
                  result.trust_level === "SUCCESS"
                    ? "text-brand-green"
                    : result.trust_level === "DANGEROUS"
                    ? "text-[#e5e56e]"
                    : result.trust_level === "FAIL"
                    ? "text-accent-red"
                    : "text-[#8B939F]"
                )}>
                  Trust Level: {result.trust_level}
                </div>
              )}
              <div className="w-full">
                <pre
                  ref={logRef}
                  className="ohdb-log-output dark-log max-h-[300px] min-h-[300px] w-full min-w-0 overflow-auto text-sm leading-relaxed bg-transparent p-0"
                  style={{ textAlign: 'left' }}
                >
                  {logs.length > 1
                    ? logs.map((line, i) => <span key={i} className="block">{colorizeLogLine(line)}</span>)
                    : result && result.output
                    ? result.output.split(/\r?\n/).map((line, i) => <span key={i} className="block">{colorizeLogLine(line)}</span>)
                    : null}
                </pre>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
