"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "I",
    title: "Sensors Read",
    description: "Every 3.5 seconds, the sensor pod measures pH, turbidity, and TDS. Readings are ingested by the AI backend one by one until a batch of 5 is complete.",
    code: `// ESP32 → Backend every 3.5s
wateriq.ingest({
  ph:        7.24,
  turbidity: 34.1,  // NTU
  tds:       480,   // ppm
  stage:     'post_lamella'
})

// Status: COLLECTING (3/5)`,
  },
  {
    number: "II",
    title: "AI Analyzes",
    description: "Six intelligence layers run in sequence: composite WQI scoring, cross-sensor confidence analysis, flatline detection, auto-recalibration, cycle fingerprinting, and stage-aware classification.",
    code: `// 6-layer analysis result
{
  bracket:   'F2',
  wqi:       { score: 74.2 },
  confidence:{ level: 'high',
    recommendation: 'proceed' },
  reusable:  true,
  suggestedTank: 'A'
}`,
  },
  {
    number: "III",
    title: "Water is Routed",
    description: "The dashboard sends a pump command. The ESP32 polls, executes valve routing to Tank A (reuse) or Tank B (discard), and acknowledges. The system resets to IDLE for the next cycle.",
    code: `// Pump command sent
wateriq.route({
  command:     'START_PUMP_A',
  destination: 'reuse_tank',
  wqi_score:   74.2,
  bracket:     'F2'
})

// Reuse rate this session: 73%`,
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="system"
      ref={sectionRef}
      className="relative py-24 lg:py-32 bg-background text-foreground overflow-hidden"
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
        <div className="mb-16 lg:mb-24">
          <div className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Process
          </div>
          <h2
            className={`text-4xl lg:text-6xl font-display tracking-tight transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            From Greywater
            <br />
            <span className="text-muted-foreground">to Clean Water.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Steps */}
          <div className="space-y-0">
            {steps.map((step, index) => (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`w-full text-left py-8 border-b border-foreground/10 transition-all duration-500 group ${
                  activeStep === index ? "opacity-100" : "opacity-40 hover:opacity-70"
                }`}
              >
                <div className="flex items-start gap-6">
                  <span className="font-display text-3xl text-foreground/30">{step.number}</span>
                  <div className="flex-1">
                    <h3 className="text-2xl lg:text-3xl font-display mb-3 group-hover:translate-x-2 transition-transform duration-300">
                      {step.title}
                    </h3>
                    <p className="text-foreground/60 leading-relaxed">
                      {step.description}
                    </p>
                    {activeStep === index && (
                      <div className="mt-4 h-px bg-foreground/20 overflow-hidden">
                        <div 
                          className="h-full bg-foreground w-0"
                          style={{ animation: 'progress 5s linear forwards' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Code display */}
          <div className="lg:sticky lg:top-32 self-start">
            <div className="border border-foreground/20 overflow-hidden bg-foreground/5 backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-foreground/20 flex items-center justify-between bg-foreground/10">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs font-mono text-foreground/50">workflow.ts</span>
              </div>
              <div className="p-8 font-mono text-sm min-h-[280px]">
                <pre className="text-foreground/80">
                  {steps[activeStep].code.split('\n').map((line, lineIndex) => (
                    <div 
                      key={`${activeStep}-${lineIndex}`} 
                      className="leading-loose code-line-reveal"
                      style={{ animationDelay: `${lineIndex * 80}ms` }}
                    >
                      <span className="text-foreground/40 select-none w-8 inline-block">{lineIndex + 1}</span>
                      <span className="inline-flex">
                        {line.split('').map((char, charIndex) => {
                          let colorClass = 'text-cyan-400';
                          if (char === '{' || char === '}' || char === '[' || char === ']' || char === '(' || char === ')') {
                            colorClass = 'text-pink-400';
                          } else if (line.includes('//')) {
                            colorClass = 'text-green-400/60';
                          }
                          return (
                            <span
                              key={`${activeStep}-${lineIndex}-${charIndex}`}
                              className={`code-char-reveal ${colorClass}`}
                              style={{
                                animationDelay: `${lineIndex * 80 + charIndex * 15}ms`,
                                textShadow: colorClass === 'text-cyan-400' ? '0 0 10px rgba(34, 211, 238, 0.5)' : 
                                            colorClass === 'text-pink-400' ? '0 0 10px rgba(244, 114, 182, 0.5)' :
                                            colorClass === 'text-green-400/60' ? '0 0 10px rgba(74, 222, 128, 0.3)' : 'none'
                              }}
                            >
                              {char === ' ' ? '\u00A0' : char}
                            </span>
                          );
                        })}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>
              <div className="px-6 py-4 border-t border-foreground/20 flex items-center gap-3 bg-foreground/10">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-mono text-foreground/50">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .code-line-reveal {
          opacity: 0;
          transform: translateX(-8px);
          animation: lineReveal 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes lineReveal {
          to { opacity: 1; transform: translateX(0); }
        }
        .code-char-reveal {
          opacity: 0;
          filter: blur(8px);
          animation: charReveal 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes charReveal {
          to { opacity: 1; filter: blur(0); }
        }
      `}</style>
    </section>
  );
}
