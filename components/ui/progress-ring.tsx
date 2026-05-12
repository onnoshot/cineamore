"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface ProgressRingProps {
  segments: number;
  completed: number;
  active?: boolean;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

export function ProgressRing({
  segments,
  completed,
  active = false,
  size = 200,
  strokeWidth = 6,
  className,
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 8;
  const segmentLength = (circumference - gap * segments) / segments;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF375F" />
            <stop offset="100%" stopColor="#BF5AF2" />
          </linearGradient>
        </defs>

        {Array.from({ length: segments }).map((_, i) => {
          const segmentStart =
            i * (segmentLength + gap) - circumference / 4;
          const isDone = i < completed;
          const isActive = i === completed && active;

          return (
            <motion.circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={isDone ? "url(#ring-gradient)" : "rgba(255,255,255,0.10)"}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={-segmentStart}
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                stroke: isDone
                  ? "url(#ring-gradient)"
                  : isActive
                  ? "rgba(255,255,255,0.25)"
                  : "rgba(255,255,255,0.10)",
              }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            />
          );
        })}

        {/* Inner pulsing ring when active */}
        {active && (
          <motion.circle
            cx={cx}
            cy={cy}
            r={radius - strokeWidth - 4}
            fill="none"
            stroke="rgba(255, 55, 95, 0.15)"
            strokeWidth={strokeWidth * 2}
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.97, 1.02, 0.97] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </svg>

      {/* Center label */}
      {label && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white/90">{completed}/{segments}</span>
          <span className="text-sm text-white/50 mt-1">{label}</span>
        </div>
      )}
    </div>
  );
}
