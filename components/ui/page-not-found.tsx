"use client";
import { useEffect, useRef, useState } from "react";

export default function NotFoundPage() {
  return (
    <div className="w-full h-screen bg-white overflow-hidden flex justify-center items-center relative safe-area">
      <MessageDisplay />
      <CharactersAnimation />
      <CircleAnimation />
    </div>
  );
}

function MessageDisplay() {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="fixed inset-0 flex justify-center items-center z-[100] px-4 py-8 md:px-0">
      <div className={`flex flex-col items-center transition-opacity duration-500 w-full max-w-xl ${isVisible ? "opacity-100" : "opacity-0"}`}>
        <div className="text-2xl sm:text-3xl md:text-4xl font-semibold text-black mb-4">Page Not Found</div>
        <div className="text-5xl sm:text-6xl md:text-8xl font-bold text-black mb-4">404</div>
        <div className="text-sm sm:text-base md:text-lg text-center text-black mb-8 leading-relaxed">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button 
            onClick={() => window.history.back()} 
            className="w-full sm:w-auto text-black border-2 border-black hover:bg-black hover:text-white transition-all duration-300 ease-in-out px-6 py-3 text-base font-medium flex items-center justify-center gap-2 hover:scale-105 active:scale-95 touch-highlight-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            Go Back
          </button>
          <button 
            onClick={() => (window.location.href = "/")} 
            className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 transition-all duration-300 ease-in-out px-6 py-3 text-base font-medium flex items-center justify-center gap-2 hover:scale-105 active:scale-95 touch-highlight-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2 2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

type StickFigure = { top?: string; bottom?: string; src: string; transform?: string; speedX: number; speedRotation?: number; };

function CharactersAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const figures: StickFigure[] = [
      { top: "0%", src: "https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick0.svg", transform: "rotateZ(-90deg)", speedX: 1500 },
      { top: "10%", src: "https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick1.svg", speedX: 3000, speedRotation: 2000 },
      { top: "20%", src: "https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick2.svg", speedX: 5000, speedRotation: 1000 },
      { top: "25%", src: "https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick0.svg", speedX: 2500, speedRotation: 1500 },
      { top: "35%", src: "https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick0.svg", speedX: 2000, speedRotation: 300 },
      { bottom: "5%", src: "https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick3.svg", speedX: 0 },
    ];
    if (ref.current) ref.current.innerHTML = "";
    figures.forEach((fig, i) => {
      const el = document.createElement("img");
      el.style.cssText = `position:absolute;width:clamp(12%, 18vw, 18%);height:clamp(12%, 18vw, 18%);object-fit:contain;filter:invert(1) brightness(0.8);`;
      if (fig.top) el.style.top = fig.top;
      if (fig.bottom) el.style.bottom = fig.bottom;
      el.src = fig.src;
      if (fig.transform) el.style.transform = fig.transform;
      el.loading = "lazy";
      ref.current?.appendChild(el);
      if (i === 5) return;
      el.animate([{ left: "100%" }, { left: "-20%" }], { duration: fig.speedX, easing: "linear", fill: "forwards" });
      if (i === 0) return;
      if (fig.speedRotation) el.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(-360deg)" }], { duration: fig.speedRotation, iterations: Infinity, easing: "linear" });
    });
    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, []);
  return <div ref={ref} className="absolute inset-0 w-full h-full" />;
}

interface Circulo { x: number; y: number; size: number; }

function CircleAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const timerRef = useRef(0);
  const circles = useRef<Circulo[]>([]);

  const init = () => {
    const c = canvasRef.current; if (!c) return;
    circles.current = [];
    for (let i = 0; i < 300; i++) {
      circles.current.push({
        x: Math.floor(Math.random() * (c.width * 3 - c.width * 1.2 + 1)) + c.width * 1.2,
        y: Math.floor(Math.random() * (c.height * 1.2)) - c.height * 0.2,
        size: c.width / 1000,
      });
    }
  };

  const draw = () => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    timerRef.current++;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#333333";
    ctx.clearRect(0, 0, c.width, c.height);
    const dx = c.width / 80, gr = c.width / 1000;
    circles.current.forEach((circle) => {
      ctx.beginPath();
      if (timerRef.current < 65) { circle.x -= dx; circle.size += gr; }
      else if (timerRef.current < 500) { circle.x -= dx * 0.02; circle.size += gr * 0.2; }
      ctx.arc(circle.x, circle.y, circle.size, 0, 360);
      ctx.fill();
    });
    if (timerRef.current > 500) { if (rafRef.current) cancelAnimationFrame(rafRef.current); return; }
    rafRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const setup = () => { c.width = window.innerWidth; c.height = window.innerHeight; timerRef.current = 0; if (rafRef.current) cancelAnimationFrame(rafRef.current); init(); draw(); };
    setup();
    window.addEventListener("resize", setup);
    return () => { window.removeEventListener("resize", setup); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
