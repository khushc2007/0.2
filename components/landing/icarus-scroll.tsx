"use client";

import { useEffect, useRef, useState } from "react";

// ASCII frames for Icarus - key poses interpolated
// Phase 0: Near sun, arms up triumphant, wings spread
// Phase 1: Tipping, losing balance
// Phase 2: Falling head-down, wings fragmenting
// Phase 3: Terminal fall, feathers gone

const ICARUS_FRAMES = [
  // Frame 0 - Triumphant, near sun, wings full
  [
    "  \\\\o//  ",
    "   |     ",
    "  /|\\   ",
    "  / \\   ",
  ],
  // Frame 1 - Starting to tip
  [
    "  \\o/    ",
    "   |\\    ",
    "  /| \\   ",
    "  /   \\  ",
  ],
  // Frame 2 - Off balance
  [
    "   \\o    ",
    "   /|    ",
    "  / |\\   ",
    "    / \\  ",
  ],
  // Frame 3 - Tipping forward
  [
    "   o/    ",
    "  /|     ",
    " / |\\    ",
    "   / \\   ",
  ],
  // Frame 4 - Head down beginning
  [
    "  _o     ",
    "  /|\\    ",
    " /   \\   ",
    "  | |    ",
  ],
  // Frame 5 - Falling, arms flailing
  [
    "   o     ",
    "  /|\\    ",
    " / | \\   ",
    "  \\ /    ",
  ],
  // Frame 6 - Mid fall, wings losing feathers
  [
    "   o.    ",
    " \\-|-/   ",
    "   |     ",
    "  / \\    ",
  ],
  // Frame 7 - Accelerating down
  [
    "  .o.    ",
    " \\-|-/   ",
    "   |`    ",
    "  /|\\    ",
  ],
  // Frame 8 - Wings broken, arms out desperately
  [
    "  .o.    ",
    "  \\|/    ",
    "  /|     ",
    " /  `    ",
  ],
  // Frame 9 - Near bottom, wings gone
  [
    "  _o_    ",
    "   |     ",
    "  /|\\    ",
    " / | \\   ",
  ],
];

// Scattered feathers that appear as he falls
const FEATHERS = ["'", "`", ".", ",", "´", "·", "˙", "∙", "°", "·"];

interface Feather {
  x: number;
  y: number;
  char: string;
  opacity: number;
  drift: number;
  speed: number;
}

export function IcarusScroll() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const scrollRef = useRef(0);
  const feathersRef = useRef<Feather[]>([]);
  const timeRef = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Track scroll within the page
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      scrollRef.current = Math.min(scrollY / Math.max(maxScroll, 1), 1);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const scroll = scrollRef.current; // 0 = top, 1 = bottom
      timeRef.current += 0.04;
      const t = timeRef.current;

      // Figure position: starts near top-center, falls to bottom
      const frameIndex = Math.floor(scroll * (ICARUS_FRAMES.length - 1));
      const frameBlend = (scroll * (ICARUS_FRAMES.length - 1)) % 1;
      const currentFrame = ICARUS_FRAMES[Math.min(frameIndex, ICARUS_FRAMES.length - 1)];

      // Icarus Y position: starts ~15% from top, ends ~90% from top
      const icarusY = h * 0.12 + scroll * h * 0.78;

      // X position: slight sway as he falls, then locks to center
      const swayAmount = scroll < 0.3 ? 0 : Math.min((scroll - 0.3) * 30, 15);
      const icarusX = w * 0.5 + Math.sin(t * 2) * swayAmount * scroll;

      // Color: warm gold → orange → cold blue as he falls
      const warmR = Math.round(255 - scroll * 100);
      const warmG = Math.round(200 - scroll * 200);
      const warmB = Math.round(50 + scroll * 205);
      const figureColor = `rgb(${warmR},${warmG},${warmB})`;

      // Font size: slightly larger near sun (closer), smaller as perspective drops
      const fontSize = 14 + (1 - scroll) * 4;
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // --- Draw figure ---
      const lineHeight = fontSize * 1.4;
      const figureOpacity = 0.85;

      ctx.fillStyle = figureColor;
      ctx.globalAlpha = figureOpacity;

      currentFrame.forEach((line, i) => {
        const y = icarusY + (i - currentFrame.length / 2) * lineHeight;

        // Wobble/shake during fall
        const wobbleX = scroll > 0.4 ? Math.sin(t * 8 + i) * scroll * 3 : 0;

        ctx.fillText(line, icarusX + wobbleX, y);
      });

      // --- Scatter feathers when falling (after 30% scroll) ---
      if (scroll > 0.3 && Math.random() < scroll * 0.3) {
        const featherChar = FEATHERS[Math.floor(Math.random() * FEATHERS.length)];
        feathersRef.current.push({
          x: icarusX + (Math.random() - 0.5) * 60,
          y: icarusY,
          char: featherChar,
          opacity: 0.6 + Math.random() * 0.4,
          drift: (Math.random() - 0.5) * 1.5,
          speed: 0.3 + Math.random() * 0.5,
        });
        // Cap feathers
        if (feathersRef.current.length > 80) {
          feathersRef.current.shift();
        }
      }

      // Update and draw feathers
      feathersRef.current = feathersRef.current.filter((f) => f.opacity > 0.05);
      feathersRef.current.forEach((feather) => {
        feather.y += feather.speed;
        feather.x += feather.drift;
        feather.opacity *= 0.985;

        const featherWarm = `rgba(${Math.round(255 - scroll * 60)}, ${Math.round(140 - scroll * 100)}, ${Math.round(20 + scroll * 200)}, ${feather.opacity})`;
        ctx.fillStyle = featherWarm;
        ctx.globalAlpha = feather.opacity;
        ctx.font = `${11 + Math.random() * 3}px monospace`;
        ctx.fillText(feather.char, feather.x, feather.y);
      });

      // --- Sun rays near tetrahedron (only at top ~30% of page) ---
      if (scroll < 0.35) {
        const sunOpacity = (0.35 - scroll) / 0.35;
        const sunY = h * 0.08;
        const sunX = w * 0.5;
        const rayChars = ["|", "/", "\\", "-", "~", "*"];
        const rayCount = 12;
        ctx.font = "13px monospace";

        for (let i = 0; i < rayCount; i++) {
          const angle = (i / rayCount) * Math.PI * 2 + t * 0.5;
          const rayLen = 3 + Math.floor(Math.random() * 2);
          for (let r = 1; r <= rayLen; r++) {
            const rx = sunX + Math.cos(angle) * r * 18;
            const ry = sunY + Math.sin(angle) * r * 14;
            const charI = Math.floor((i + r) % rayChars.length);
            const rayFade = (1 - r / (rayLen + 1)) * sunOpacity * 0.6;
            // Warm golden glow
            ctx.fillStyle = `rgba(255, 200, 60, ${rayFade})`;
            ctx.globalAlpha = rayFade;
            ctx.fillText(rayChars[charI], rx, ry);
          }
        }
      }

      ctx.globalAlpha = 1;
      frameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(frameRef.current);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 1,
        width: "100vw",
        height: "100vh",
        opacity: 0.55,
      }}
    />
  );
}
