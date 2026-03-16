"use client";

import { useEffect, useRef, useState } from "react";

const dataPoints = [
  { value: "400L",  label: "average greywater per household per day" },
  { value: "40%",   label: "of total water use that could be reused" },
  { value: "₹0",    label: "operational cost after installation" },
  { value: "100%",  label: "automated — no human intervention required" },
];

export function ProblemSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="problem"
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Diagonal lines pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            currentColor 40px,
            currentColor 41px
          )`
        }} />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Eyebrow */}
        <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-12">
          <span className="w-8 h-px bg-foreground/30" />
          The Problem
        </span>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left: big headline */}
          <div>
            <h2
              className={`text-4xl lg:text-6xl font-display tracking-tight leading-[1.0] transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              40% of residential
              <br />
              water use is
              <br />
              greywater.
              <br />
              <span className="text-muted-foreground">None of it is reused.</span>
            </h2>
          </div>

          {/* Right: body copy + data grid */}
          <div
            className={`transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Showers, sinks, and washing machines generate hundreds of litres of greywater every day per household.
              This water is not sewage — it is lightly contaminated and highly treatable.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Yet 100% of it is discarded directly into the drain, wasting a resource that could offset
              40% of a building&apos;s total water consumption.
            </p>
            <p className="text-lg font-display tracking-tight mb-12">
              WATER-IQ changes this. Automatically.
            </p>

            {/* Data points grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-foreground/10">
              {dataPoints.map((point, i) => (
                <div
                  key={point.value}
                  className={`bg-background p-6 transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: `${300 + i * 80}ms` }}
                >
                  <div className="font-display text-3xl mb-2">{point.value}</div>
                  <div className="font-mono text-xs text-muted-foreground leading-relaxed">{point.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
