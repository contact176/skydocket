import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { CloudSun } from "lucide-react";

// Floating particles that drift upward
const PARTICLES = [
  { x: 8,  y: 82, size: 5,  delay: 0,    dur: 3.2 },
  { x: 22, y: 74, size: 3,  delay: 0.6,  dur: 2.6 },
  { x: 38, y: 88, size: 7,  delay: 0.2,  dur: 3.8 },
  { x: 52, y: 78, size: 4,  delay: 1.0,  dur: 2.8 },
  { x: 67, y: 85, size: 6,  delay: 0.4,  dur: 3.4 },
  { x: 80, y: 72, size: 3,  delay: 0.8,  dur: 2.4 },
  { x: 91, y: 80, size: 5,  delay: 0.15, dur: 3.0 },
  { x: 15, y: 55, size: 4,  delay: 1.3,  dur: 2.9 },
  { x: 44, y: 60, size: 3,  delay: 0.7,  dur: 3.6 },
  { x: 73, y: 58, size: 6,  delay: 0.5,  dur: 2.7 },
  { x: 58, y: 90, size: 4,  delay: 1.1,  dur: 3.1 },
  { x: 30, y: 66, size: 5,  delay: 0.9,  dur: 2.5 },
];

function Particle({ x, y, size, delay, dur }) {
  return (
    <motion.span
      className="absolute rounded-full bg-blue-400/25 pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      animate={{ y: [-0, -100], opacity: [0, 0.7, 0] }}
      transition={{ delay, duration: dur, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

// Individual letter reveal for the wordmark
function AnimatedWord({ text, delay }) {
  return (
    <span className="inline-flex">
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + i * 0.04, duration: 0.4, ease: "easeOut" }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * SplashScreen — animated brand intro shown once on load.
 * Calls onDone() after the animation completes.
 */
export default function SplashScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2700);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#070d1b] overflow-hidden select-none"
      exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.55, ease: "easeInOut" } }}
    >
      {/* ── Background gradient orbs ──────────────────────────────────────── */}
      <motion.div
        className="absolute top-[15%] left-[20%] w-[480px] h-[480px] rounded-full bg-blue-700/10 blur-[96px] pointer-events-none"
        animate={{ scale: [1, 1.18, 1], opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[15%] right-[18%] w-[380px] h-[380px] rounded-full bg-indigo-600/10 blur-[80px] pointer-events-none"
        animate={{ scale: [1.15, 1, 1.15], opacity: [0.4, 0.2, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[55%] left-[55%] w-[200px] h-[200px] rounded-full bg-blue-400/8 blur-[60px] pointer-events-none"
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* ── Floating particles ────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}
      </div>

      {/* ── Thin horizontal rule lines for depth ─────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="absolute w-full h-px bg-slate-300" style={{ top: `${12 + i * 11}%` }} />
        ))}
      </div>

      {/* ── Logo icon ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative mb-7"
      >
        {/* Pulsing glow halo */}
        <motion.div
          className="absolute -inset-3 rounded-[2rem] bg-blue-500/20 blur-2xl pointer-events-none"
          animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Icon container */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-blue-600 shadow-2xl shadow-blue-600/60">
          <motion.div
            animate={{ rotate: [0, 8, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <CloudSun className="h-12 w-12 text-white drop-shadow-lg" />
          </motion.div>
          {/* Shine sweep */}
          <motion.div
            className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-tr from-white/0 via-white/20 to-white/0"
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: "150%", opacity: [0, 1, 0] }}
            transition={{ delay: 0.4, duration: 0.7, ease: "easeInOut" }}
          />
        </div>
      </motion.div>

      {/* ── Wordmark ──────────────────────────────────────────────────────── */}
      <div className="text-4xl font-bold tracking-tight text-white overflow-hidden">
        <AnimatedWord text="Skydocket" delay={0.35} />
      </div>

      {/* ── Tagline ───────────────────────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.45, ease: "easeOut" }}
        className="mt-2 text-slate-400 text-sm tracking-wide"
      >
        Weather, translated into action.
      </motion.p>

      {/* ── Animated loading dots ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.3 }}
        className="mt-12 flex gap-1.5"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-blue-500"
            animate={{ opacity: [0.25, 1, 0.25], scale: [1, 1.4, 1] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
