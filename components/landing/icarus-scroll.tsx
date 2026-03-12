"use client";

import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  life: number;
  maxLife: number;
  r: number;
  g: number;
  b: number;
}

interface SunParticle {
  angle: number;
  dist: number;
  speed: number;
  radius: number;
  opacity: number;
  layer: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function getScrollColor(scroll: number): [number, number, number] {
  if (scroll < 0.4) {
    const t = scroll / 0.4;
    return [lerp(255, 255, t), lerp(210, 120, t), lerp(60, 20, t)];
  } else if (scroll < 0.75) {
    const t = (scroll - 0.4) / 0.35;
    return [lerp(255, 80, t), lerp(120, 60, t), lerp(20, 220, t)];
  } else {
    const t = (scroll - 0.75) / 0.25;
    return [lerp(80, 30, t), lerp(60, 30, t), lerp(220, 255, t)];
  }
}

function drawDotLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  count: number,
  r: number, g: number, b: number,
  baseAlpha: number,
  radius: number = 2,
  cx?: number, cy?: number
) {
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    let x: number, y: number;

    if (cx !== undefined && cy !== undefined) {
      x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
      y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
    } else {
      x = lerp(x1, x2, t);
      y = lerp(y1, y2, t);
    }

    const jitter = radius * 0.4;
    const jx = x + (Math.random() - 0.5) * jitter;
    const jy = y + (Math.random() - 0.5) * jitter;

    const grad = ctx.createRadialGradient(jx, jy, 0, jx, jy, radius * 3);
    grad.addColorStop(0, `rgba(${r},${g},${b},${baseAlpha * 0.4})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.arc(jx, jy, radius * 3, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(jx, jy, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},${baseAlpha})`;
    ctx.fill();
  }
}

function drawDotCircle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, circleR: number,
  r: number, g: number, b: number,
  alpha: number,
  dotRadius: number = 2
) {
  const count = Math.floor(circleR * 4.5);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = cx + Math.cos(angle) * circleR;
    const y = cy + Math.sin(angle) * circleR;
    ctx.beginPath();
    ctx.arc(x + (Math.random() - 0.5), y + (Math.random() - 0.5), dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.fill();
  }
  for (let dr = circleR * 0.25; dr < circleR; dr += circleR * 0.3) {
    const innerCount = Math.floor(dr * 3);
    for (let i = 0; i < innerCount; i++) {
      const angle = (i / innerCount) * Math.PI * 2;
      const x = cx + Math.cos(angle) * dr;
      const y = cy + Math.sin(angle) * dr;
      ctx.beginPath();
      ctx.arc(x, y, dotRadius * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.7})`;
      ctx.fill();
    }
  }
}

function drawWing(
  ctx: CanvasRenderingContext2D,
  originX: number, originY: number,
  startAngle: number, endAngle: number,
  minR: number, maxR: number,
  layers: number,
  r: number, g: number, b: number,
  alpha: number,
  fragmentProgress: number
) {
  const intactLayers = Math.ceil(layers * (1 - fragmentProgress * 0.9));
  for (let layer = 0; layer < intactLayers; layer++) {
    const layerT = layer / layers;
    const radius = lerp(minR, maxR, layerT);
    const arcLength = endAngle - startAngle;
    const dotCount = Math.floor(radius * Math.abs(arcLength) / 5);
    const layerAlpha = alpha * (1 - layerT * 0.5) * (1 - fragmentProgress * layerT);

    for (let i = 0; i < dotCount; i++) {
      const t = i / dotCount;
      const angle = startAngle + arcLength * t;
      const x = originX + Math.cos(angle) * radius;
      const y = originY + Math.sin(angle) * radius;
      const dotR = lerp(2.5, 1.2, layerT);

      ctx.beginPath();
      ctx.arc(x + (Math.random() - 0.5) * 2, y + (Math.random() - 0.5) * 2, dotR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${layerAlpha})`;
      ctx.fill();

      if (Math.random() < 0.15) {
        const gGrad = ctx.createRadialGradient(x, y, 0, x, y, dotR * 4);
        gGrad.addColorStop(0, `rgba(${r},${g},${b},${layerAlpha * 0.5})`);
        gGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(x, y, dotR * 4, 0, Math.PI * 2);
        ctx.fillStyle = gGrad;
        ctx.fill();
      }
    }
  }
}

export function IcarusScroll() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const scrollRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const sunParticlesRef = useRef<SunParticle[]>([]);
  const timeRef = useRef(0);
  const lastEmitRef = useRef(0);
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

    sunParticlesRef.current = Array.from({ length: 180 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: 20 + Math.random() * 80,
      speed: 0.2 + Math.random() * 0.5,
      radius: 0.8 + Math.random() * 2,
      opacity: 0.2 + Math.random() * 0.8,
      layer: Math.floor(Math.random() * 3),
    }));

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const render = (timestamp: number) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      ctx.clearRect(0, 0, W, H);

      const scroll = scrollRef.current;
      timeRef.current += 0.016;
      const t = timeRef.current;

      const [cr, cg, cb] = getScrollColor(scroll);

      // ── SUN ──
      const sunFade = Math.max(0, 1 - scroll * 3);
      if (sunFade > 0.01) {
        const sunX = W * 0.5;
        const sunY = H * 0.07;

        const coreGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 70);
        coreGrad.addColorStop(0, `rgba(255,230,100,${0.9 * sunFade})`);
        coreGrad.addColorStop(0.3, `rgba(255,180,40,${0.5 * sunFade})`);
        coreGrad.addColorStop(1, `rgba(255,100,0,0)`);
        ctx.beginPath();
        ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();

        const haloGrad = ctx.createRadialGradient(sunX, sunY, 40, sunX, sunY, 160);
        haloGrad.addColorStop(0, `rgba(255,200,60,${0.15 * sunFade})`);
        haloGrad.addColorStop(1, `rgba(255,100,0,0)`);
        ctx.beginPath();
        ctx.arc(sunX, sunY, 160, 0, Math.PI * 2);
        ctx.fillStyle = haloGrad;
        ctx.fill();

        sunParticlesRef.current.forEach((sp) => {
          sp.angle += sp.speed * 0.008 * (sp.layer + 1);
          sp.dist += sp.speed * 0.15;
          if (sp.dist > 130) {
            sp.dist = 15 + Math.random() * 20;
            sp.opacity = 0.4 + Math.random() * 0.6;
          }
          const px = sunX + Math.cos(sp.angle) * sp.dist;
          const py = sunY + Math.sin(sp.angle) * sp.dist * 0.7;
          const pAlpha = sp.opacity * sunFade * (1 - sp.dist / 140);
          ctx.beginPath();
          ctx.arc(px, py, sp.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,${180 + sp.layer * 20},${50 + sp.layer * 30},${pAlpha})`;
          ctx.fill();
        });

        const rayCount = 16;
        for (let i = 0; i < rayCount; i++) {
          const rayAngle = (i / rayCount) * Math.PI * 2 + t * 0.12;
          const rayLen = 50 + Math.sin(t * 0.8 + i * 0.7) * 25;
          const x1 = sunX + Math.cos(rayAngle) * 28;
          const y1 = sunY + Math.sin(rayAngle) * 18;
          const x2 = sunX + Math.cos(rayAngle) * (28 + rayLen);
          const y2 = sunY + Math.sin(rayAngle) * (18 + rayLen * 0.65);
          const grad = ctx.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, `rgba(255,200,60,${0.5 * sunFade})`);
          grad.addColorStop(1, `rgba(255,120,0,0)`);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.2 + Math.sin(t + i) * 0.5;
          ctx.stroke();
        }
      }

      // ── ICARUS ──
      const S = (v: number) => v * Math.min(W, H) * 0.065;

      const figX = W * 0.5 + Math.sin(t * 0.4) * S(scroll < 0.3 ? 0.3 : 0) * (1 - scroll);
      const figY = H * 0.13 + scroll * H * 0.8;

      let bodyRotation: number;
      if (scroll < 0.25) {
        bodyRotation = 0;
      } else if (scroll < 0.6) {
        const rt = (scroll - 0.25) / 0.35;
        bodyRotation = easeInOut(rt) * Math.PI * 0.65;
      } else {
        const rt = (scroll - 0.6) / 0.4;
        bodyRotation = Math.PI * 0.65 + easeInOut(rt) * Math.PI * 0.65;
      }

      const tumble = scroll > 0.45 ? Math.sin(t * 3.5) * scroll * 0.15 : 0;
      const rot = bodyRotation + tumble;

      const bx = Math.sin(rot);
      const by = -Math.cos(rot);

      const headR = S(0.18);
      const torsoLen = S(0.55);
      const limbLen = S(0.45);

      const headX = figX - bx * (torsoLen * 0.5 + headR);
      const headY = figY - by * (torsoLen * 0.5 + headR);
      const hipX = figX + bx * torsoLen * 0.5;
      const hipY = figY + by * torsoLen * 0.5;
      const shoulderX = figX - bx * torsoLen * 0.2;
      const shoulderY = figY - by * torsoLen * 0.2;

      let armL: number, armR: number;
      if (scroll < 0.2) {
        armL = rot - Math.PI * 0.7;
        armR = rot + Math.PI * 0.7;
      } else if (scroll < 0.5) {
        const at = (scroll - 0.2) / 0.3;
        armL = rot - Math.PI * (0.7 - at * 0.3);
        armR = rot + Math.PI * (0.7 - at * 0.3);
      } else {
        const at = (scroll - 0.5) / 0.5;
        armL = rot - Math.PI * (0.4 + Math.sin(t * 4) * 0.2 * at);
        armR = rot + Math.PI * (0.4 + Math.cos(t * 4.3) * 0.2 * at);
      }

      const legSpread = scroll < 0.35 ? 0.12 : 0.12 + (scroll - 0.35) * 0.5;
      const legL = rot + Math.PI + legSpread + Math.sin(t * 3) * scroll * 0.1;
      const legR = rot + Math.PI - legSpread + Math.cos(t * 3.2) * scroll * 0.1;

      const wingFrag = scroll < 0.3 ? 0 : Math.min((scroll - 0.3) / 0.65, 1);
      const wingSpread = Math.PI * (scroll < 0.3 ? 0.7 : 0.7 - wingFrag * 0.35);

      const alpha = 0.82;
      const wingAngleL_start = rot - Math.PI * 0.1;
      const wingAngleL_end = rot - Math.PI * 0.1 - wingSpread;
      const wingAngleR_start = rot + Math.PI * 0.1;
      const wingAngleR_end = rot + Math.PI * 0.1 + wingSpread;

      drawWing(ctx, shoulderX, shoulderY, wingAngleL_start, wingAngleL_end,
        S(0.15), S(1.1), 8, cr, cg, cb, alpha * 0.75, wingFrag);
      drawWing(ctx, shoulderX, shoulderY, wingAngleR_start, wingAngleR_end,
        S(0.15), S(1.1), 8, cr, cg, cb, alpha * 0.75, wingFrag);

      drawDotLine(ctx,
        figX - bx * torsoLen * 0.5, figY - by * torsoLen * 0.5,
        figX + bx * torsoLen * 0.5, figY + by * torsoLen * 0.5,
        20, cr, cg, cb, alpha, 2.2);

      drawDotCircle(ctx, headX, headY, headR, cr, cg, cb, alpha, 2);

      const armEndLX = shoulderX + Math.cos(armL) * limbLen;
      const armEndLY = shoulderY + Math.sin(armL) * limbLen;
      const armEndRX = shoulderX + Math.cos(armR) * limbLen;
      const armEndRY = shoulderY + Math.sin(armR) * limbLen;
      const armCLX = shoulderX + Math.cos(armL + 0.3) * limbLen * 0.5;
      const armCLY = shoulderY + Math.sin(armL + 0.3) * limbLen * 0.5;
      const armCRX = shoulderX + Math.cos(armR - 0.3) * limbLen * 0.5;
      const armCRY = shoulderY + Math.sin(armR - 0.3) * limbLen * 0.5;

      drawDotLine(ctx, shoulderX, shoulderY, armEndLX, armEndLY, 14, cr, cg, cb, alpha, 2, armCLX, armCLY);
      drawDotLine(ctx, shoulderX, shoulderY, armEndRX, armEndRY, 14, cr, cg, cb, alpha, 2, armCRX, armCRY);
      drawDotLine(ctx, hipX, hipY, hipX + Math.cos(legL) * limbLen * 0.85, hipY + Math.sin(legL) * limbLen * 0.85, 14, cr, cg, cb, alpha, 2);
      drawDotLine(ctx, hipX, hipY, hipX + Math.cos(legR) * limbLen * 0.85, hipY + Math.sin(legR) * limbLen * 0.85, 14, cr, cg, cb, alpha, 2);

      // ── EMIT FEATHERS ──
      if (scroll > 0.28 && timestamp - lastEmitRef.current > 60) {
        lastEmitRef.current = timestamp;
        const emitCount = Math.floor(scroll * 5);
        for (let i = 0; i < emitCount; i++) {
          if (particlesRef.current.length >= 250) break;
          const wingT = Math.random();
          const wSide = Math.random() < 0.5 ? -1 : 1;
          const wAngle = wSide < 0
            ? lerp(wingAngleL_start, wingAngleL_end, wingT)
            : lerp(wingAngleR_start, wingAngleR_end, wingT);
          const wDist = lerp(S(0.15), S(1.1), wingT * (1 - wingFrag * 0.5));
          const px = shoulderX + Math.cos(wAngle) * wDist;
          const py = shoulderY + Math.sin(wAngle) * wDist;

          particlesRef.current.push({
            x: px + (Math.random() - 0.5) * 10,
            y: py + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -0.5 + Math.random() * 2.5,
            radius: 1 + Math.random() * 2,
            opacity: 0.5 + Math.random() * 0.5,
            life: 0,
            maxLife: 120 + Math.random() * 120,
            r: Math.min(255, Math.max(0, cr + Math.floor((Math.random() - 0.5) * 40))),
            g: Math.min(255, Math.max(0, cg + Math.floor((Math.random() - 0.5) * 40))),
            b: Math.min(255, Math.max(0, cb + Math.floor((Math.random() - 0.5) * 40))),
          });
        }
      }

      // ── DRAW FEATHERS ──
      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);
      particlesRef.current.forEach(p => {
        p.life++;
        p.vy += 0.04;
        p.vx += (Math.random() - 0.5) * 0.08;
        p.x += p.vx;
        p.y += p.vy;
        const lifeT = p.life / p.maxLife;
        const pAlpha = p.opacity * (1 - lifeT * lifeT);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${pAlpha})`;
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 1,
        opacity: 0.52,
        pointerEvents: "none",
      }}
    />
  );
}
