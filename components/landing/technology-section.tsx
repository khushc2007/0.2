"use client";

import { useEffect, useRef, useState } from "react";

const layers = [
  {
    number: "L1",
    name: "Composite WQI",
    description: "Stage-aware weighting of pH, turbidity, and TDS into a 0–100 quality score. Post-lamella: turbidity weighted 50%. Pre-lamella: TDS weighted 50%.",
    badge: "Scoring",
  },
  {
    number: "L2",
    name: "Confidence Analysis",
    description: "Cross-sensor agreement measured pairwise. If sensors disagree, confidence drops and triggers physical re-treatment — extend EC cycle, re-run, or discard.",
    badge: "Novel",
  },
  {
    number: "L3",
    name: "Flatline Detection",
    description: "Monitors last 4 readings per sensor. If delta ≤ 0.01 across all readings, sensor is classified as dead. Immediately forces F5 discard — the system never routes water when a sensor has failed.",
    badge: "Safety",
  },
  {
    number: "L4",
    name: "Cross-Sensor Recalibration",
    description: "TDS and pH form a ground-truth signal. If turbidity deviates by more than 0.35 on the normalised scale, it is automatically corrected by factor 0.88 before analysis runs.",
    badge: "Auto-correct",
  },
  {
    number: "L5",
    name: "Cycle Fingerprinting",
    description: "Captures the slope of each sensor curve across the batch. Detects anomalous shapes against 5 predefined rules and against the 5-cycle rolling baseline. Outputs an anomaly score 0–1.",
    badge: "Anomaly",
  },
  {
    number: "L6",
    name: "Stage-Aware Classification",
    description: "Every reading carries a stage field: pre_lamella or post_lamella. This changes WQI weights and generates a contextual note — e.g. 'EC + settling effective. Clean water routing confirmed.'",
    badge: "Context",
  },
];

function LayerRow({ layer, index }: { layer: typeof layers[0]; index: number }) {
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
      className={`group flex flex-col sm:flex-row items-start sm:items-center gap-6 py-8 border-b border-foreground/10 
        transition-all duration-700 hover:translate-x-2 cursor-default ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Layer number */}
      <div className="shrink-0 w-12">
        <span className="font-mono text-sm text-muted-foreground">{layer.number}</span>
      </div>

      {/* Name */}
      <div className="shrink-0 w-56">
        <span className="font-display text-xl lg:text-2xl">{layer.name}</span>
      </div>

      {/* Description */}
      <div className="flex-1">
        <p className="text-muted-foreground leading-relaxed text-sm lg:text-base">{layer.description}</p>
      </div>

      {/* Badge */}
      <div className="shrink-0">
        <span className="inline-flex items-center px-3 py-1 font-mono text-xs border border-foreground/20 text-muted-foreground bg-foreground/5 group-hover:border-foreground/40 transition-colors">
          {layer.badge}
        </span>
      </div>
    </div>
  );
}

export function TechnologySection() {
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
    <section id="technology" ref={sectionRef} className="relative py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Intelligence Stack
          </span>
          <h2
            className={`text-4xl lg:text-6xl font-display tracking-tight transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Six algorithms.
            <br />
            <span className="text-muted-foreground">One decision.</span>
          </h2>
        </div>

        <div>
          {layers.map((layer, index) => (
            <LayerRow key={layer.number} layer={layer} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
