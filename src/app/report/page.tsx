"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, type Variants } from "framer-motion";
import { AlertTriangle, Sparkles, ShieldAlert, Cpu, Orbit, Activity } from "lucide-react";
import type { AuditReport } from "@/lib/schemas/audit-report.schema";

// ─── HARDCODED MOCK JSON (Matches strict backend schema) ──────────────

const MOCK_REPORT: AuditReport = {
  targetUrl: "https://example.com/enterprise-solutions",
  auditedAt: new Date().toISOString(),
  overallClarityScore: 68,
  overallReadabilityLevel: "college",
  summary:
    "The target vector exhibits severe cognitive load due to excessive corporate jargon and passive sentence constructions. Remediation required to optimize user conversion velocity.",
  jargon: [
    {
      term: "Synergize",
      definition: "To combine or work together",
      occurrences: 4,
    },
    {
      term: "Leverage",
      definition: "To use something to maximum advantage",
      occurrences: 7,
    },
    {
      term: "Paradigm shift",
      definition: "A fundamental change in approach",
      occurrences: 2,
    },
  ],
  sections: [
    {
      sectionName: "Hero Header",
      clarityScore: 45,
      readabilityLevel: "graduate",
      issues: ["Passive voice usage", "Overly dense vocabulary vector"],
      suggestions: [
        {
          original:
            "Our synergy-driven solutions are leveraged by enterprise ecosystems to disrupt traditional paradigms seamlessly.",
          improved:
            "Enterprise teams use our tools to work faster and outpace the competition.",
          reason:
            "Stripped 4 jargon tokens. Converted passive state to active velocity.",
        },
      ],
    },
  ],
  globalSuggestions: [],
};

// ─── UTILITY COMPONENTS ─────────────────────────────────────────────

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 40, damping: 15 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplay(Math.round(latest));
    });
  }, [springValue]);

  return <>{display}</>;
}

// ─── ANIMATION VARIANTS ─────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(12px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { ease: "easeOut", duration: 0.8 },
  },
};

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────

export default function ReportDashboard() {
  const [report, setReport] = useState<AuditReport | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("audit-report");
    if (saved) {
      try {
        setReport(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse report data", e);
        setReport(MOCK_REPORT);
      }
    } else {
      setReport(MOCK_REPORT);
    }
  }, []);

  if (!report) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center font-mono text-[#00f2fe] text-xl animate-pulse">
        Initializing Interface...
      </div>
    );
  }

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const targetOffset =
    circumference - (report.overallClarityScore / 100) * circumference;

  return (
    <div className="w-full min-h-screen py-10 flex flex-col">
      {/* HUD Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-10 w-full border-b border-zinc-800/50 pb-6 flex items-end justify-between"
      >
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
            System Report
          </h1>
          <p className="text-zinc-500 font-mono mt-2 text-sm flex items-center gap-2">
            <Orbit className="w-4 h-4 text-[#00f2fe] animate-[spin_10s_linear_infinite]" />
            TARGET: <span className="text-[#00f2fe]">{report.targetUrl}</span>
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="font-mono text-xs text-zinc-600 uppercase">
            Timestamp
          </div>
          <div className="font-mono text-zinc-400 text-sm">
            {new Date(report.auditedAt).toISOString().split("T").join(" ")}
          </div>
        </div>
      </motion.div>

      {/* Bento Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min"
      >
        {/* CARD 1: Hero Metric (Clarity Score) */}
        <motion.div
          variants={cardVariants}
          className="col-span-1 aspect-square md:aspect-auto backdrop-blur-md bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-[#00f2fe]/40 hover:bg-zinc-900/60 transition-all duration-500 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute top-4 left-4 flex items-center gap-2 text-zinc-500 font-mono text-xs uppercase tracking-widest">
            <Cpu className="w-4 h-4 text-[#00f2fe]" /> Metric Alpha
          </div>

          <div className="relative w-[160px] h-[160px] flex items-center justify-center mt-4">
            {/* Background Circle */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-zinc-800"
                strokeWidth="12"
                fill="none"
              />
              {/* Animated Progress Circle */}
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-[#00f2fe]"
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: targetOffset }}
                transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                strokeDasharray={circumference}
                style={{
                  filter: "drop-shadow(0px 0px 8px rgba(0,242,254,0.4))",
                }}
              />
            </svg>
            <div className="text-5xl font-black text-white tabular-nums tracking-tighter">
              <AnimatedNumber value={report.overallClarityScore} />
            </div>
          </div>
          <div className="mt-6 text-sm font-mono text-zinc-400 uppercase tracking-widest text-center">
            Overall Clarity
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f2fe]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>

        {/* CARD 2: Data-Dense Metrics */}
        <motion.div
          variants={cardVariants}
          className="col-span-1 md:col-span-2 backdrop-blur-md bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-[#f355da]/40 hover:bg-zinc-900/60 transition-all duration-500 flex flex-col justify-between shadow-[0_0_30px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs uppercase tracking-widest mb-6">
            <Activity className="w-4 h-4 text-[#f355da]" /> Telemetry Data
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            <div className="space-y-2">
              <div className="text-zinc-500 font-mono text-xs uppercase">
                Reading Level
              </div>
              <div className="text-3xl lg:text-4xl font-mono text-white tracking-tighter uppercase">
                {report.overallReadabilityLevel.replace("_", " ")}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-zinc-500 font-mono text-xs uppercase">
                Jargon Tokens
              </div>
              <div className="text-3xl lg:text-4xl font-mono text-white tracking-tighter flex items-end gap-2">
                <AnimatedNumber
                  value={report.jargon.reduce(
                    (acc, j) => acc + j.occurrences,
                    0
                  )}
                />
                <span className="text-sm text-[#f355da] mb-1">detected</span>
              </div>
            </div>

            <div className="space-y-2 col-span-2 lg:col-span-1">
              <div className="text-zinc-500 font-mono text-xs uppercase">
                Passive Voice
              </div>
              <div className="text-3xl lg:text-4xl font-mono text-white tracking-tighter flex items-end gap-2">
                <AnimatedNumber value={42} />
                <span className="text-sm text-zinc-500 mb-1">%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1 mt-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "42%" }}
                  transition={{ duration: 1.5, delay: 1 }}
                  className="h-full bg-zinc-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-800/50">
            <p className="text-sm text-zinc-400 font-mono leading-relaxed">
              <span className="text-[#f355da] mr-2">› [SUMMARY]</span>
              {report.summary}
            </p>
          </div>
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#f355da]/10 blur-[80px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </motion.div>

        {/* CARD 3: The Code Refactor Matrix */}
        <motion.div
          variants={cardVariants}
          className="col-span-1 md:col-span-3 backdrop-blur-md bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 md:p-8 relative overflow-hidden group shadow-[0_0_40px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs uppercase tracking-widest mb-8">
            <ShieldAlert className="w-4 h-4 text-rose-500" /> Code Refactor Matrix
          </div>

          <div className="flex flex-col lg:flex-row gap-6 w-full relative">
            {/* Left: Original Fragment */}
            <div className="flex-1 bg-zinc-950/50 border border-rose-900/30 rounded-xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-rose-500 font-mono text-xs uppercase tracking-wider">
                  Original Fragment
                </span>
              </div>
              <p className="text-zinc-300 font-mono text-sm leading-relaxed">
                {report.sections[0].suggestions[0].original}
              </p>
              
              <div className="mt-6 inline-flex gap-2 text-xs font-mono text-rose-400/80 bg-rose-950/30 px-3 py-1.5 rounded-md border border-rose-900/50">
                <AlertTriangle className="w-3.5 h-3.5" /> Jargon Heavy
              </div>
            </div>

            {/* Middle Divider (Desktop) */}
            <div className="hidden lg:flex items-center justify-center shrink-0 w-8">
              <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-zinc-700 to-transparent relative">
                <motion.div 
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ y: [0, 100, 0], opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-12 bg-[#00f2fe] blur-[2px]"
                />
              </div>
            </div>

            {/* Right: AI Optimized Rewrite */}
            <div className="flex-1 bg-[#00f2fe]/[0.02] border border-[#00f2fe]/30 rounded-xl p-6 relative overflow-hidden shadow-[inset_0_0_30px_rgba(0,242,254,0.05)]">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#00f2fe]" />
                <span className="text-[#00f2fe] font-mono text-xs uppercase tracking-wider">
                  AI Optimized Rewrite
                </span>
              </div>
              <p className="text-white font-mono text-sm md:text-base leading-relaxed drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                {report.sections[0].suggestions[0].improved}
              </p>

              <div className="mt-6 flex flex-col gap-2 border-t border-[#00f2fe]/20 pt-4">
                <span className="text-zinc-500 font-mono text-xs uppercase">
                  Optimization Reason
                </span>
                <p className="text-zinc-400 font-mono text-xs leading-relaxed">
                  {report.sections[0].suggestions[0].reason}
                </p>
              </div>

              {/* Glowing Corner Accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-[#00f2fe] rounded-tl-xl opacity-50" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-[#00f2fe] rounded-br-xl opacity-50" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
