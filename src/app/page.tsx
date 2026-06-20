"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Activity, ChevronRight } from "lucide-react";

import { useRouter } from "next/navigation";

const TITLE_WORDS = "VIBE & CLARITY AUDITOR".split(" ");

const LOG_STEPS = [
  "[INIT] Establishing connection to target vectors...",
  "[SCAN] Firecrawl engine processing HTML layouts...",
  "[PARSING] Stripping token noise, packaging Markdown core...",
  "[COGNITIVE] Streaming text payload to inference node...",
  "[COMPLETE] Synthesis ready. Generating matrix layout...",
];

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [logs, setLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  // Mock processing simulation
  useEffect(() => {
    if (!isProcessing) return;

    let timeout: NodeJS.Timeout;
    const streamLogs = () => {
      if (currentStep < LOG_STEPS.length) {
        setLogs((prev) => [...prev, LOG_STEPS[currentStep]]);
        setCurrentStep((prev) => prev + 1);
        // Random delay between 800ms and 1800ms
        timeout = setTimeout(streamLogs, 800 + Math.random() * 1000);
      }
    };

    // Initial delay before logs start
    timeout = setTimeout(streamLogs, 600);
    return () => clearTimeout(timeout);
  }, [isProcessing, currentStep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isProcessing) return;
    setIsProcessing(true);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        throw new Error("Failed to audit URL");
      }

      const { data } = await res.json();
      sessionStorage.setItem("audit-report", JSON.stringify(data));
      router.push("/report");
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setLogs((prev) => [...prev, "[ERROR] Sequence failed. Restarting..."]);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-[80vh] items-center justify-center py-12">
      
      {/* HEADER SECTION */}
      <div className="text-center w-full max-w-5xl mx-auto mb-12">
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter flex flex-wrap justify-center gap-x-4 gap-y-2 uppercase leading-none">
          {TITLE_WORDS.map((word, i) => (
            <div key={i} className="overflow-hidden inline-flex pb-2">
              <motion.span
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                transition={{
                  delay: i * 0.15,
                  duration: 0.7,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-500 drop-shadow-[0_5px_15px_rgba(255,255,255,0.1)]"
              >
                {word}
              </motion.span>
            </div>
          ))}
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-lg md:text-xl text-slate-400 font-medium tracking-wide mt-6"
        >
          Absolute clarity. Zero tolerance for noise.
        </motion.p>
      </div>

      {/* SUBMISSION PORTAL */}
      <motion.form
        onSubmit={handleSubmit}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-3xl mx-auto z-10 px-4"
      >
        <motion.div
          layout
          className={`relative group rounded-2xl overflow-hidden p-[2px] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isProcessing ? "w-[280px] mx-auto h-[64px]" : "w-full h-[80px]"
          }`}
        >
          {/* Spinning Conic Gradient Base */}
          <div
            className="absolute inset-[-150%] animate-spin"
            style={{
              animationDuration: "4s",
              background: `conic-gradient(from 0deg, transparent 0%, transparent 60%, #00f2fe 80%, #f355da 100%)`,
            }}
          />

          {/* Intensified Glow Layer (Reacts to Focus) */}
          <div
            className={`absolute inset-[-150%] animate-spin blur-xl transition-opacity duration-500 ${
              isFocused && !isProcessing ? "opacity-100" : "opacity-30"
            }`}
            style={{
              animationDuration: "4s",
              background: `conic-gradient(from 0deg, transparent 0%, transparent 60%, #00f2fe 80%, #f355da 100%)`,
            }}
          />

          {/* Inner Mask (Hollows out the center) */}
          <div className="absolute inset-[2px] bg-[#030303]/95 backdrop-blur-2xl rounded-[14px]" />

          {/* Inner Content Area */}
          <div className="relative w-full h-full flex items-center px-6">
            <AnimatePresence mode="popLayout">
              {!isProcessing ? (
                <motion.div
                  key="input-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                  transition={{ duration: 0.3 }}
                  className="flex w-full items-center gap-4 h-full"
                >
                  <ChevronRight
                    className={`w-7 h-7 flex-shrink-0 transition-colors duration-300 ${
                      isFocused ? "text-[#f355da]" : "text-[#00f2fe]"
                    }`}
                  />
                  <input
                    type="url"
                    required
                    placeholder="Initialize target URL..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full h-full bg-transparent border-none outline-none text-[#f8fafc] text-xl placeholder:text-slate-600 font-mono"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="processing-view"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex w-full items-center justify-center gap-3 font-mono text-[#00f2fe] h-full"
                >
                  <Activity className="w-6 h-6 animate-pulse text-[#f355da]" />
                  <span className="text-base font-bold tracking-widest uppercase">
                    Processing
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.form>

      {/* TERMINAL LOGS */}
      <div className="w-full max-w-3xl px-4 mt-12 min-h-[300px]">
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-full bg-[#09090b]/60 border border-[#27272a]/80 rounded-xl p-6 md:p-8 font-mono text-sm shadow-[0_0_50px_rgba(0,0,0,0.3)] backdrop-blur-md relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-6 border-b border-[#27272a]/80 pb-4">
                <Terminal className="w-5 h-5 text-[#f355da]" />
                <span className="text-slate-400 font-bold tracking-widest text-xs uppercase">
                  System Orchestration Logs
                </span>
                <div className="ml-auto flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-[#00f2fe]/50 animate-pulse" />
                </div>
              </div>

              <div className="space-y-4">
                {logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-4 text-slate-300 text-sm md:text-base leading-relaxed"
                  >
                    <span className="text-[#00f2fe] shrink-0 mt-[2px]">›</span>
                    <span className="drop-shadow-[0_0_8px_rgba(0,242,254,0.3)]">
                      {log}
                    </span>
                  </motion.div>
                ))}
                {currentStep < LOG_STEPS.length && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-2.5 h-5 bg-[#f355da] mt-4 ml-[28px] shadow-[0_0_10px_rgba(243,85,218,0.5)]"
                  />
                )}
              </div>

              {/* Hardware Accent Lines */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f2fe]/40 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#f355da]/40 to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
