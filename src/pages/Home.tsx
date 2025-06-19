import { useState } from "react";
import Hero from "@/components/Hero";
import RestoreInput from "@/components/RestoreInput";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [entered, setEntered] = useState(false);

  return (
    <div className="relative flex flex-col min-h-screen overflow-x-hidden font-sans">
      <main className="flex-grow overflow-hidden">
        <AnimatePresence mode="wait">
          {entered ? (
            <motion.div
              key="restore"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <RestoreInput
                onRunRestore={(dsn) => console.log("Run restore for", dsn)}
                onRunDemo={() => console.log("Run demo DB")}
              />
            </motion.div>
          ) : (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Hero onEnter={() => setEntered(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
