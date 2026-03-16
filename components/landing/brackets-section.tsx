"use client";

import { useEffect, useRef, useState } from "react";

const brackets = [
  { id: "F1", turbidity: "≤ 10 NTU",  tds: "< 1000 ppm",    method: "Sediment + Carbon polishing",  outcome: "Route to reuse",         color: "cyan"   },
  { id: "F2", turbidity: "10–30 NTU", tds: "< 1000 ppm",    method: "Sand + Carbon filtration",      outcome: "Route to reuse",         color: "cyan"   },
  { id: "F3", turbidity: "> 30 NTU",  tds: "< 1000 ppm",    method: "Coagulation + Sand",            outcome: "Re-treat",               color: "amber"  },
  { id: "F4", turbidity: "—",         tds: "1000–1500 ppm",  method: "Advanced treatment",            outcome: "Discard recommended",    color: "orange" },
  { id: "F5", turbidity: "—",         tds: "> 1500 ppm",     method: "RO / Disposal",                 outcome: "Hard discard",           color: "red"    },
];

const colorMap: Record<string, string> = {
  cyan:   "border-cyan-500/60 text-cyan-400",
  amber:  "border-amber-500/60 text-amber-400",
  orange: "border-orange-500/60 text-orange-400",
  red:    "border-red-500/60 text-red-400",
};

const outcomeBg: Record<string, string> = {
  cyan:   "bg-cyan-500/10 text-cyan-400",
  amber:  "bg-amber-500/10 text-amber-400",
  orange: "bg-orange-500/10 text-orange-400",
  red:    "bg-red-500/10 text-red-400",
};

function BracketRow({ bracket, index }: { bracket: typeof brackets[0]; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.2 }
    );
    if (rowRef.current) observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rowRef}
      className={`grid grid-cols-2 lg:grid-cols-5 gap-4 items-center py-6 px-4 border-b border-foreground/10
        border-l-2 ${colorMap[bracket.color]}
        transition-all duration-700 hover:bg-foreground/[0.02] ${
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className={`font-display text-2xl ${colorMap[bracket.color].split(' ')[1]}`}>{bracket.id}</div>
      <div className="font-mono text-sm text-muted-foreground">{bracket.turbidity}</div>
      <div className="font-mono text-sm text-muted-foreground">{bracket.tds}</div>
      <div className="text-sm text-muted-foreground col-span-2 lg:col-span-1">{bracket.method}</div>
      <div className="col-span-2 lg:col-span-1">
        <span className={`inline-flex items-center px-3 py-1 font-mono text-xs ${outcomeBg[bracket.color]}`}>
          {bracket.outcome}
        </span>
      </div>
    </div>
  );
}

export function BracketsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="brackets" ref={sectionRef} className="relative py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Classification System
          </span>
          <h2
            className={`text-4xl lg:text-6xl font-display tracking-tight transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Five brackets.
            <br />
            <span className="text-muted-foreground">Automatic routing.</span>
          </h2>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 py-4 px-4 mb-2">
          {["Bracket", "Turbidity", "TDS", "Method", "Outcome"].map((h) => (
            <div key={h} className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{h}</div>
          ))}
        </div>

        <div>
          {brackets.map((bracket, index) => (
            <BracketRow key={bracket.id} bracket={bracket} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
