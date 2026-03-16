"use client";

import { useEffect, useRef, useState } from "react";

const team = [
  {
    name: "Khush Chadha",
    role: "Founder & Software Lead",
    bio: "Full-stack systems engineering, AI pipeline architecture, and end-to-end product development.",
    mono: "BENGALURU",
  },
  {
    name: "Bhavyaman Atri",
    role: "Hardware Lead",
    bio: "Leads physical prototype development — electrocoagulation chamber design, ESP32 control systems, sensor integration, and tank fabrication.",
    mono: "PROTOTYPE ENGINEERING",
  },
  {
    name: "Rajat A.N",
    role: "Hardware Engineer",
    bio: "Supports hardware build and testing — component sourcing, circuit assembly, sensor calibration, and physical system validation.",
    mono: "SYSTEMS & TESTING",
  },
];

function TeamCard({ member, index }: { member: typeof team[0]; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.2 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`group p-8 border border-foreground/10 hover:border-foreground/30 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="mb-6">
        <h3 className="font-display text-3xl lg:text-4xl mb-2 group-hover:translate-x-1 transition-transform duration-300">
          {member.name}
        </h3>
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{member.role}</span>
      </div>
      <p className="text-muted-foreground leading-relaxed mb-6">{member.bio}</p>
      <span className="font-mono text-xs text-foreground/30">{member.mono}</span>
    </div>
  );
}

export function TeamSection() {
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
    <section id="team" ref={sectionRef} className="relative py-24 lg:py-32 border-t border-foreground/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Built by
          </span>
          <h2
            className={`text-4xl lg:text-6xl font-display tracking-tight transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            The team behind
            <br />
            <span className="text-muted-foreground">WATER-IQ.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-foreground/10">
          {team.map((member, index) => (
            <TeamCard key={member.name} member={member} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
