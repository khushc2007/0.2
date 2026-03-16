"use client";

import { ArrowRight, Check } from "lucide-react";

const plans = [
  {
    name: "Residential",
    description: "8–50 units",
    features: [
      "40–70% water savings",
      "Automated quality scoring",
      "Mobile dashboard access",
      "Real-time sensor monitoring",
      "Email support",
    ],
    cta: "Get a Quote",
    popular: false,
  },
  {
    name: "Commercial",
    description: "50–500 units",
    features: [
      "Everything in Residential",
      "Centralized multi-unit monitoring",
      "Historical data analytics",
      "Automated compliance reporting",
      "Priority installation",
      "24/7 dashboard",
      "API access",
    ],
    cta: "Get a Quote",
    popular: true,
  },
  {
    name: "City Scale",
    description: "500+ units",
    features: [
      "Everything in Commercial",
      "Unlimited unit scale",
      "Smart city integration",
      "Custom SLA",
      "On-site support",
      "Municipal APIs",
      "White-label option",
      "Regulatory compliance package",
    ],
    cta: "Get a Quote",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="deploy" className="relative py-32 lg:py-40 border-t border-foreground/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="max-w-3xl mb-20">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Deployment
          </span>
          <h2 className="font-display text-4xl lg:text-6xl tracking-tight text-foreground mb-6">
            Built for every
            <br />
            <span className="text-muted-foreground">Scale.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl">
            From a single apartment block to a city-wide rollout.
            WATER-IQ deploys in under a day and operates with zero ongoing manual input.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-px bg-foreground/10">
          {plans.map((plan, idx) => (
            <div
              key={plan.name}
              className={`relative p-8 lg:p-12 bg-background ${
                plan.popular ? "md:-my-4 md:py-12 lg:py-16 border-2 border-foreground" : ""
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-8 px-3 py-1 bg-foreground text-primary-foreground text-xs font-mono uppercase tracking-widest">
                  Most Popular
                </span>
              )}

              <div className="mb-8">
                <span className="font-mono text-xs text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-3xl text-foreground mt-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              <div className="mb-8 pb-8 border-b border-foreground/10">
                <span className="font-display text-4xl text-foreground">Custom Quote</span>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all group ${
                  plan.popular
                    ? "bg-foreground text-primary-foreground hover:bg-foreground/90"
                    : "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground/5"
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          All deployments include installation, training, and ongoing maintenance.{" "}
          <a href="/not-found-page" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Download full specifications
          </a>
        </p>
      </div>
    </section>
  );
}
