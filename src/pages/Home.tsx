import { useState } from "react";
import Hero from "@/components/Hero";
import RestoreInput from "@/components/RestoreInput";
import Footer from "@/components/Footer";
import DumpUpload from "@/components/DumpUpload";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [phase, setPhase] = useState<"hero" | "restore" | "upload">("hero");

  return (
    <div className="relative flex flex-col min-h-screen overflow-x-hidden font-sans">
      <main className="flex-grow overflow-hidden">
        <AnimatePresence mode="wait">
          {phase === "hero" && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Hero onEnter={() => setPhase("restore")} />
            </motion.div>
          )}
          {phase === "restore" && (
            <motion.div
              key="restore"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <RestoreInput
                onRunRestore={(dsn) => console.log("Run restore for", dsn)}
                onRunDemo={() => {}}
                onUploadDump={() => setPhase("upload")}
              />
            </motion.div>
          )}
          {phase === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <DumpUpload onBack={() => setPhase("restore")} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
