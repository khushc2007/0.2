"use client";

import { useEffect, useRef, useState } from "react";

// ─── physics types ───────────────────────────────────────────────────────────
interface Feather {
  x: number; y: number;
  vx: number; vy: number;
  angle: number; spin: number;
  len: number; width: number;
  opacity: number; life: number; maxLife: number;
  r: number; g: number; b: number;
}

interface FlameParticle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  opacity: number; life: number; maxLife: number;
}

// ─── math helpers ────────────────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
const easeCubic = (t: number) => t * t * (3 - 2 * t);

// ─── body colour along fall arc ──────────────────────────────────────────────
function bodyColor(scroll: number, alpha: number): string {
  let r, g, b;
  if (scroll < 0.35) {
    // near sun: warm gold-white
    const t = scroll / 0.35;
    r = lerp(255, 255, t); g = lerp(240, 160, t); b = lerp(180, 40, t);
  } else if (scroll < 0.7) {
    // mid fall: orange → red
    const t = (scroll - 0.35) / 0.35;
    r = lerp(255, 200, t); g = lerp(160, 40, t); b = lerp(40, 20, t);
  } else {
    // ocean: deep cold blue
    const t = (scroll - 0.7) / 0.3;
    r = lerp(200, 40, t); g = lerp(40, 60, t); b = lerp(20, 200, t);
  }
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`;
}

function sunColor(alpha: number): string {
  return `rgba(255,230,80,${alpha})`;
}

// ─── draw helpers ────────────────────────────────────────────────────────────
function strokeLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  w: number, color: string
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineWidth = w;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.stroke();
}

function strokeCurve(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  cpx: number, cpy: number,
  x2: number, y2: number,
  w: number, color: string
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cpx, cpy, x2, y2);
  ctx.lineWidth = w;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.stroke();
}

// Draw a single realistic feather shape as a filled path
function drawFeatherShape(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  angle: number,
  len: number, width: number,
  r: number, g: number, b: number, alpha: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Quill line
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(len, 0);
  ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.6})`;
  ctx.lineWidth = width * 0.18;
  ctx.stroke();

  // Vane - left side
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.3, -width * 0.6, len * 0.85, -width * 0.15);
  ctx.quadraticCurveTo(len * 0.55, -width * 0.2, len * 0.2, 0);
  ctx.closePath();
  ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.55})`;
  ctx.fill();

  // Vane - right side
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.3, width * 0.45, len * 0.85, width * 0.12);
  ctx.quadraticCurveTo(len * 0.55, width * 0.15, len * 0.2, 0);
  ctx.closePath();
  ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.45})`;
  ctx.fill();

  ctx.restore();
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export function IcarusScroll() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const scrollRef = useRef(0);
  const feathersRef = useRef<Feather[]>([]);
  const flamesRef = useRef<FlameParticle[]>([]);
  const timeRef = useRef(0);
  const lastFeatherRef = useRef(0);
  const physicsRef = useRef({
    // Icarus horizontal position drifts left as he falls
    x: 0.5,      // 0..1 of canvas width
    vx: 0,
    windPhase: Math.random() * 100,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

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
      scrollRef.current = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const render = (ts: number) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      ctx.clearRect(0, 0, W, H);

      const scroll = scrollRef.current;
      const dt = 0.016;
      timeRef.current += dt;
      const T = timeRef.current;

      const phys = physicsRef.current;

      // ── PHYSICS: drift left with wind turbulence ──────────────────────────
      // Only starts drifting after fall begins (~20% scroll)
      if (scroll > 0.15) {
        const fallT = clamp((scroll - 0.15) / 0.85, 0, 1);
        // Leftward base drift + Perlin-like wind
        const wind = Math.sin(T * 0.9 + phys.windPhase) * 0.0006
                   + Math.sin(T * 2.1 + phys.windPhase * 0.5) * 0.0003;
        const baseDrift = -0.0008 * fallT;
        phys.vx += baseDrift + wind;
        // Slight air resistance
        phys.vx *= 0.97;
        phys.x += phys.vx;
        // Soft bounds (stays on screen)
        if (phys.x < 0.1) { phys.x = 0.1; phys.vx *= -0.3; }
        if (phys.x > 0.9) { phys.x = 0.9; phys.vx *= -0.3; }
      } else {
        // Near sun: gentle floating bob
        phys.x = 0.5 + Math.sin(T * 0.7) * 0.025;
        phys.vx = 0;
      }

      const figX = W * phys.x;
      // Vertical: starts 14% from top near sun, falls to 88%
      const figYt = scroll < 0.15
        ? 0.14 + Math.sin(T * 1.1) * 0.008   // floating near sun
        : 0.14 + easeCubic(clamp((scroll - 0.15) / 0.85, 0, 1)) * 0.74;
      const figY = H * figYt;

      // ── BODY SCALE: large and prominent ──────────────────────────────────
      const baseScale = Math.min(W, H) * 0.0022;
      // Larger near sun, still large during fall
      const scale = baseScale * lerp(1.4, 1.1, clamp(scroll * 2, 0, 1));

      const u = (v: number) => v * scale;  // unit → px

      // ── BODY ROTATION ─────────────────────────────────────────────────────
      // 0 = upright, π = head-down
      let bodyAngle: number;
      if (scroll < 0.18) {
        // Upright, slight sway
        bodyAngle = Math.sin(T * 0.9) * 0.06;
      } else if (scroll < 0.55) {
        // Tipping forward then tumbling
        const rt = ease(clamp((scroll - 0.18) / 0.37, 0, 1));
        bodyAngle = rt * Math.PI * 0.8;
      } else {
        // Continuing rotation to head-down + random tumble
        const rt = ease(clamp((scroll - 0.55) / 0.45, 0, 1));
        const tumble = Math.sin(T * 2.5) * clamp(scroll - 0.55, 0, 1) * 0.25;
        bodyAngle = Math.PI * 0.8 + rt * Math.PI * 0.55 + tumble;
      }

      // Laugh wiggle of torso (head rocks side to side from ~20% scroll)
      const laughPhase = scroll > 0.12 ? Math.sin(T * 6.5) * clamp((scroll - 0.12) * 3, 0, 1) * 0.12 : 0;

      // Direction vectors along body spine
      const spineX = Math.sin(bodyAngle + laughPhase);
      const spineY = -Math.cos(bodyAngle + laughPhase);
      const perpX = -spineY;  // perpendicular
      const perpY = spineX;

      // Key joint positions in world space
      // figX/figY is the CENTER OF TORSO
      const torsoHalf = u(18);
      const shoulderX = figX - spineX * torsoHalf;
      const shoulderY = figY - spineY * torsoHalf;
      const hipX = figX + spineX * torsoHalf;
      const hipY = figY + spineY * torsoHalf;
      const headX = shoulderX - spineX * u(10);
      const headY = shoulderY - spineY * u(10);

      // ── ARM POSES ─────────────────────────────────────────────────────────
      // Arms: angles relative to body axis
      let leftArmAngle: number, rightArmAngle: number;
      let leftForeAngle: number, rightForeAngle: number;

      if (scroll < 0.15) {
        // Triumphant: both arms reaching UP toward sun
        leftArmAngle = bodyAngle - Math.PI * 0.55 + Math.sin(T * 1.2) * 0.06;
        rightArmAngle = bodyAngle + Math.PI * 0.55 + Math.cos(T * 1.1) * 0.06;
        leftForeAngle = leftArmAngle - 0.3;
        rightForeAngle = rightArmAngle + 0.3;
      } else if (scroll < 0.45) {
        // Tipping: arms start flailing
        const at = ease(clamp((scroll - 0.15) / 0.3, 0, 1));
        leftArmAngle = bodyAngle - Math.PI * (0.55 - at * 0.2) + Math.sin(T * 3) * at * 0.2;
        rightArmAngle = bodyAngle + Math.PI * (0.55 - at * 0.2) + Math.cos(T * 3.3) * at * 0.2;
        leftForeAngle = leftArmAngle - 0.4 * at;
        rightForeAngle = rightArmAngle + 0.4 * at;
      } else {
        // Full fall: arms wildly flailing
        const flailAmp = clamp(scroll - 0.45, 0, 1);
        leftArmAngle = bodyAngle - Math.PI * 0.35 + Math.sin(T * 4.8) * flailAmp * 0.55;
        rightArmAngle = bodyAngle + Math.PI * 0.35 + Math.cos(T * 5.1) * flailAmp * 0.55;
        leftForeAngle = leftArmAngle + Math.sin(T * 5.5 + 1) * flailAmp * 0.5;
        rightForeAngle = rightArmAngle + Math.cos(T * 5.8 + 2) * flailAmp * 0.5;
      }

      // Upper arm end
      const uArmLen = u(13);
      const lArmLen = u(12);
      const lUpperLX = shoulderX + Math.cos(leftArmAngle) * uArmLen;
      const lUpperLY = shoulderY + Math.sin(leftArmAngle) * uArmLen;
      const rUpperLX = shoulderX + Math.cos(rightArmAngle) * uArmLen;
      const rUpperLY = shoulderY + Math.sin(rightArmAngle) * uArmLen;
      // Forearm end
      const lHandX = lUpperLX + Math.cos(leftForeAngle) * lArmLen;
      const lHandY = lUpperLY + Math.sin(leftForeAngle) * lArmLen;
      const rHandX = rUpperLX + Math.cos(rightForeAngle) * lArmLen;
      const rHandY = rUpperLY + Math.sin(rightForeAngle) * lArmLen;

      // ── LEG POSES ─────────────────────────────────────────────────────────
      const legSpread = scroll < 0.3
        ? 0.15
        : 0.15 + clamp((scroll - 0.3) * 1.2, 0, 0.7);
      const legKick = scroll > 0.4 ? Math.sin(T * 4) * clamp(scroll - 0.4, 0, 1) * 0.35 : 0;
      const leftLegAngle = bodyAngle + Math.PI + legSpread + legKick;
      const rightLegAngle = bodyAngle + Math.PI - legSpread - legKick * 0.7;
      const leftKneeAngle = leftLegAngle + 0.2 + Math.abs(legKick) * 0.5;
      const rightKneeAngle = rightLegAngle - 0.2 - Math.abs(legKick) * 0.3;

      const thighLen = u(14);
      const shinLen = u(13);

      const lKneeX = hipX + Math.cos(leftLegAngle) * thighLen;
      const lKneeY = hipY + Math.sin(leftLegAngle) * thighLen;
      const rKneeX = hipX + Math.cos(rightLegAngle) * thighLen;
      const rKneeY = hipY + Math.sin(rightLegAngle) * thighLen;
      const lFootX = lKneeX + Math.cos(leftKneeAngle) * shinLen;
      const lFootY = lKneeY + Math.sin(leftKneeAngle) * shinLen;
      const rFootX = rKneeX + Math.cos(rightKneeAngle) * shinLen;
      const rFootY = rKneeY + Math.sin(rightKneeAngle) * shinLen;

      // ── WING GEOMETRY ─────────────────────────────────────────────────────
      const wingFrag = scroll < 0.25 ? 0 : clamp((scroll - 0.25) / 0.6, 0, 1);
      const wingIntact = 1 - wingFrag;
      // Wing length decreases as feathers shed
      const wingSpan = u(55) * lerp(1, 0.35, wingFrag);

      // Wing root offset from shoulder
      const wRootLX = shoulderX + perpX * u(4);
      const wRootLY = shoulderY + perpY * u(4);
      const wRootRX = shoulderX - perpX * u(4);
      const wRootRY = shoulderY - perpY * u(4);

      // Wing tip angles: spread behind body, sweep depends on scroll
      const wSweep = lerp(0.5, 0.25, clamp(scroll * 2, 0, 1));
      const wingTipLAngle = bodyAngle - Math.PI * wSweep - scroll * 0.4;
      const wingTipRAngle = bodyAngle + Math.PI * wSweep + scroll * 0.4;

      // Control points for graceful wing curve
      const wingTipLX = wRootLX + Math.cos(wingTipLAngle) * wingSpan;
      const wingTipLY = wRootLY + Math.sin(wingTipLAngle) * wingSpan;
      const wingTipRX = wRootRX + Math.cos(wingTipRAngle) * wingSpan;
      const wingTipRY = wRootRY + Math.sin(wingTipRAngle) * wingSpan;

      const wCpLX = wRootLX + Math.cos(wingTipLAngle - 0.3) * wingSpan * 0.55;
      const wCpLY = wRootLY + Math.sin(wingTipLAngle - 0.3) * wingSpan * 0.55;
      const wCpRX = wRootRX + Math.cos(wingTipRAngle + 0.3) * wingSpan * 0.55;
      const wCpRY = wRootRY + Math.sin(wingTipRAngle + 0.3) * wingSpan * 0.55;

      // ── SUN (at top, bright, fades past 30% scroll) ───────────────────────
      const sunFade = clamp(1 - scroll * 3.3, 0, 1);
      const sunX = W * 0.5;
      const sunY = H * 0.075;

      if (sunFade > 0.005) {
        // Outer atmospheric glow
        const atmoGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, u(70));
        atmoGrad.addColorStop(0, `rgba(255,255,200,${0.08 * sunFade})`);
        atmoGrad.addColorStop(0.4, `rgba(255,180,40,${0.06 * sunFade})`);
        atmoGrad.addColorStop(1, `rgba(255,80,0,0)`);
        ctx.beginPath();
        ctx.arc(sunX, sunY, u(70), 0, Math.PI * 2);
        ctx.fillStyle = atmoGrad;
        ctx.fill();

        // Corona spikes
        for (let i = 0; i < 24; i++) {
          const ang = (i / 24) * Math.PI * 2 + T * 0.08;
          const len = u(18) + Math.sin(T * 1.5 + i * 0.8) * u(8);
          const baseW = u(2.5) * Math.sin(T * 0.6 + i) * 0.3 + u(1.8);
          const sx = sunX + Math.cos(ang) * u(22);
          const sy = sunY + Math.sin(ang) * u(22);
          const ex = sunX + Math.cos(ang) * (u(22) + len);
          const ey = sunY + Math.sin(ang) * (u(22) + len);
          const spikeGrad = ctx.createLinearGradient(sx, sy, ex, ey);
          spikeGrad.addColorStop(0, `rgba(255,220,80,${0.85 * sunFade})`);
          spikeGrad.addColorStop(1, `rgba(255,140,0,0)`);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.strokeStyle = spikeGrad;
          ctx.lineWidth = baseW;
          ctx.lineCap = "round";
          ctx.stroke();
        }

        // Solar disc
        const discGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, u(21));
        discGrad.addColorStop(0, `rgba(255,255,230,${sunFade})`);
        discGrad.addColorStop(0.5, `rgba(255,220,80,${0.95 * sunFade})`);
        discGrad.addColorStop(0.85, `rgba(255,160,20,${0.8 * sunFade})`);
        discGrad.addColorStop(1, `rgba(255,80,0,0)`);
        ctx.beginPath();
        ctx.arc(sunX, sunY, u(21), 0, Math.PI * 2);
        ctx.fillStyle = discGrad;
        ctx.fill();
      }

      // ── SUN CONTACT GLOW (when near sun top ~0-18% scroll) ───────────────
      if (scroll < 0.22 && scroll > 0.0) {
        const contactT = clamp(1 - scroll / 0.22, 0, 1); // stronger at top
        const glowR = u(28) * (0.5 + contactT * 0.5);
        const contactGrad = ctx.createRadialGradient(
          lHandX, lHandY, 0, lHandX, lHandY, glowR
        );
        contactGrad.addColorStop(0, `rgba(255,240,120,${0.6 * contactT})`);
        contactGrad.addColorStop(0.4, `rgba(255,160,40,${0.3 * contactT})`);
        contactGrad.addColorStop(1, `rgba(255,80,0,0)`);
        ctx.beginPath();
        ctx.arc(lHandX, lHandY, glowR, 0, Math.PI * 2);
        ctx.fillStyle = contactGrad;
        ctx.fill();

        // Right hand too
        const rGlowR = u(22) * (0.4 + contactT * 0.4);
        const rContactGrad = ctx.createRadialGradient(rHandX, rHandY, 0, rHandX, rHandY, rGlowR);
        rContactGrad.addColorStop(0, `rgba(255,220,100,${0.45 * contactT})`);
        rContactGrad.addColorStop(1, `rgba(255,80,0,0)`);
        ctx.beginPath();
        ctx.arc(rHandX, rHandY, rGlowR, 0, Math.PI * 2);
        ctx.fillStyle = rContactGrad;
        ctx.fill();
      }

      // ── BODY GLOW AURA (always) ───────────────────────────────────────────
      const auraR = u(30);
      const auraGrad = ctx.createRadialGradient(figX, figY, 0, figX, figY, auraR);
      const [ar, ag, ab] = scroll < 0.35
        ? [255, 200, 80]
        : scroll < 0.7
        ? [220, 80, 20]
        : [40, 60, 220];
      auraGrad.addColorStop(0, `rgba(${ar},${ag},${ab},0.12)`);
      auraGrad.addColorStop(1, `rgba(${ar},${ag},${ab},0)`);
      ctx.beginPath();
      ctx.arc(figX, figY, auraR, 0, Math.PI * 2);
      ctx.fillStyle = auraGrad;
      ctx.fill();

      // ── WINGS ─────────────────────────────────────────────────────────────
      if (wingIntact > 0.05) {
        const wingAlpha = wingIntact * 0.72;
        const wColor = scroll < 0.35
          ? [255, 230, 160] : scroll < 0.65
          ? [240, 160, 60] : [180, 100, 40];

        // Wing structure lines (primary feather shafts)
        const featherCount = Math.round(lerp(9, 4, wingFrag));
        for (let fi = 0; fi < featherCount; fi++) {
          const ft = fi / (featherCount - 1);
          // Left wing feather positions along the bezier
          const bt = ft;
          const bx = (1 - bt) * (1 - bt) * wRootLX + 2 * (1 - bt) * bt * wCpLX + bt * bt * wingTipLX;
          const by = (1 - bt) * (1 - bt) * wRootLY + 2 * (1 - bt) * bt * wCpLY + bt * bt * wingTipLY;
          const featherLen = lerp(u(20), u(6), ft) * wingIntact;
          const featherAng = wingTipLAngle - 0.7 + ft * 0.5;
          const fAlpha = wingAlpha * (1 - ft * 0.4);
          const fc = `rgba(${wColor[0]},${wColor[1]},${wColor[2]},${fAlpha})`;
          strokeLine(ctx, bx, by, bx + Math.cos(featherAng - Math.PI * 0.5) * featherLen,
            by + Math.sin(featherAng - Math.PI * 0.5) * featherLen, u(0.9) + ft * u(0.3), fc);
        }
        for (let fi = 0; fi < featherCount; fi++) {
          const ft = fi / (featherCount - 1);
          const bt = ft;
          const bx = (1 - bt) * (1 - bt) * wRootRX + 2 * (1 - bt) * bt * wCpRX + bt * bt * wingTipRX;
          const by = (1 - bt) * (1 - bt) * wRootRY + 2 * (1 - bt) * bt * wCpRY + bt * bt * wingTipRY;
          const featherLen = lerp(u(20), u(6), ft) * wingIntact;
          const featherAng = wingTipRAngle + 0.7 - ft * 0.5;
          const fAlpha = wingAlpha * (1 - ft * 0.4);
          const fc = `rgba(${wColor[0]},${wColor[1]},${wColor[2]},${fAlpha})`;
          strokeLine(ctx, bx, by, bx + Math.cos(featherAng + Math.PI * 0.5) * featherLen,
            by + Math.sin(featherAng + Math.PI * 0.5) * featherLen, u(0.9) + ft * u(0.3), fc);
        }

        // Main wing curve (leading edge)
        const wStroke = `rgba(${wColor[0]},${wColor[1]},${wColor[2]},${wingAlpha})`;
        ctx.beginPath();
        ctx.moveTo(wRootLX, wRootLY);
        ctx.quadraticCurveTo(wCpLX, wCpLY, wingTipLX, wingTipLY);
        ctx.strokeStyle = wStroke;
        ctx.lineWidth = u(1.6) * wingIntact;
        ctx.lineCap = "round";
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(wRootRX, wRootRY);
        ctx.quadraticCurveTo(wCpRX, wCpRY, wingTipRX, wingTipRY);
        ctx.strokeStyle = wStroke;
        ctx.lineWidth = u(1.6) * wingIntact;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // ── BODY ──────────────────────────────────────────────────────────────
      const limbW = u(2.6);
      const torsoW = u(3.4);
      const c1 = bodyColor(scroll, 0.9);
      const c2 = bodyColor(scroll, 0.75);
      const c3 = bodyColor(scroll, 0.6);

      // TORSO
      strokeLine(ctx, shoulderX, shoulderY, hipX, hipY, torsoW, c1);
      // Slight torso width
      strokeLine(ctx,
        shoulderX + perpX * u(3), shoulderY + perpY * u(3),
        hipX + perpX * u(2), hipY + perpY * u(2),
        u(0.8), c2);
      strokeLine(ctx,
        shoulderX - perpX * u(3), shoulderY - perpY * u(3),
        hipX - perpX * u(2), hipY - perpY * u(2),
        u(0.8), c2);

      // LEGS (behind body, draw first)
      strokeLine(ctx, hipX, hipY, lKneeX, lKneeY, limbW, c2);
      strokeLine(ctx, lKneeX, lKneeY, lFootX, lFootY, limbW * 0.85, c2);
      strokeLine(ctx, hipX, hipY, rKneeX, rKneeY, limbW, c1);
      strokeLine(ctx, rKneeX, rKneeY, rFootX, rFootY, limbW * 0.85, c1);

      // ARMS
      strokeLine(ctx, shoulderX, shoulderY, lUpperLX, lUpperLY, limbW, c1);
      strokeLine(ctx, lUpperLX, lUpperLY, lHandX, lHandY, limbW * 0.85, c1);
      strokeLine(ctx, shoulderX, shoulderY, rUpperLX, rUpperLY, limbW, c2);
      strokeLine(ctx, rUpperLX, rUpperLY, rHandX, rHandY, limbW * 0.85, c2);

      // NECK
      strokeLine(ctx, headX, headY, shoulderX, shoulderY, u(1.9), c1);

      // HEAD (circle)
      const headRad = u(7.5);
      ctx.beginPath();
      ctx.arc(headX, headY, headRad, 0, Math.PI * 2);
      ctx.strokeStyle = c1;
      ctx.lineWidth = u(1.8);
      ctx.stroke();

      // Head fill (semi-transparent flesh tone)
      const headFill = ctx.createRadialGradient(
        headX - spineX * headRad * 0.2, headY - spineY * headRad * 0.2, 0,
        headX, headY, headRad
      );
      headFill.addColorStop(0, bodyColor(scroll, 0.25));
      headFill.addColorStop(1, bodyColor(scroll, 0.05));
      ctx.beginPath();
      ctx.arc(headX, headY, headRad, 0, Math.PI * 2);
      ctx.fillStyle = headFill;
      ctx.fill();

      // ── LAUGH EXPRESSION: open mouth on head ──────────────────────────────
      if (scroll > 0.08) {
        const laughIntensity = clamp((scroll - 0.08) * 5, 0, 1);
        // Mouth: arc opening on the face, tilted with head
        ctx.save();
        ctx.translate(headX, headY);
        ctx.rotate(bodyAngle + laughPhase * 2);
        const mouthY = headRad * 0.3;
        const mouthW = headRad * lerp(0.3, 0.65, laughIntensity);
        ctx.beginPath();
        ctx.arc(0, mouthY, mouthW, 0.1, Math.PI - 0.1);
        ctx.strokeStyle = bodyColor(scroll, 0.8);
        ctx.lineWidth = u(0.9);
        ctx.stroke();
        // Eyes (two dots)
        const eyeOffX = headRad * 0.28;
        const eyeOffY = -headRad * 0.15;
        ctx.beginPath();
        ctx.arc(-eyeOffX, eyeOffY, u(0.8), 0, Math.PI * 2);
        ctx.fillStyle = bodyColor(scroll, 0.9);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeOffX, eyeOffY, u(0.8), 0, Math.PI * 2);
        ctx.fill();
        // Laugh squint lines
        if (laughIntensity > 0.4) {
          const squint = (laughIntensity - 0.4) / 0.6;
          strokeLine(ctx, -eyeOffX - u(1.5), eyeOffY - u(1.2),
            -eyeOffX + u(1.5), eyeOffY - u(1.2), u(0.5),
            bodyColor(scroll, 0.5 * squint));
          strokeLine(ctx, eyeOffX - u(1.5), eyeOffY - u(1.2),
            eyeOffX + u(1.5), eyeOffY - u(1.2), u(0.5),
            bodyColor(scroll, 0.5 * squint));
        }
        ctx.restore();
      }

      // ── EMIT FEATHERS (falling burning feathers) ──────────────────────────
      if (scroll > 0.22 && ts - lastFeatherRef.current > lerp(120, 40, wingFrag)) {
        lastFeatherRef.current = ts;
        const emitN = Math.ceil(wingFrag * 4);
        const wColor2: [number, number, number] = scroll < 0.5
          ? [255, 200, 80] : [220, 120, 40];

        for (let i = 0; i < emitN; i++) {
          if (feathersRef.current.length >= 180) break;
          // Emit from random wing point
          const side = Math.random() < 0.5 ? 'L' : 'R';
          const wft = Math.random();
          const bt = wft;
          let ex: number, ey: number;
          if (side === 'L') {
            ex = (1 - bt) * (1 - bt) * wRootLX + 2 * (1 - bt) * bt * wCpLX + bt * bt * wingTipLX;
            ey = (1 - bt) * (1 - bt) * wRootLY + 2 * (1 - bt) * bt * wCpLY + bt * bt * wingTipLY;
          } else {
            ex = (1 - bt) * (1 - bt) * wRootRX + 2 * (1 - bt) * bt * wCpRX + bt * bt * wingTipRX;
            ey = (1 - bt) * (1 - bt) * wRootRY + 2 * (1 - bt) * bt * wCpRY + bt * bt * wingTipRY;
          }
          feathersRef.current.push({
            x: ex + (Math.random() - 0.5) * u(4),
            y: ey + (Math.random() - 0.5) * u(4),
            vx: (Math.random() - 0.6) * u(0.8) + phys.vx * W * 0.3,
            vy: (Math.random() - 0.3) * u(0.6),
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.12,
            len: u(8) + Math.random() * u(10),
            width: u(3) + Math.random() * u(3),
            opacity: 0.55 + Math.random() * 0.35,
            life: 0,
            maxLife: 160 + Math.random() * 200,
            r: wColor2[0] + Math.floor((Math.random() - 0.5) * 50),
            g: wColor2[1] + Math.floor((Math.random() - 0.5) * 50),
            b: wColor2[2] + Math.floor((Math.random() - 0.5) * 50),
          });
        }
      }

      // ── UPDATE & DRAW FEATHERS ─────────────────────────────────────────────
      feathersRef.current = feathersRef.current.filter(f => f.life < f.maxLife);
      feathersRef.current.forEach(f => {
        f.life++;
        f.vy += 0.045;  // gravity
        f.vx *= 0.992;  // drag
        f.vx += (Math.random() - 0.5) * 0.15;  // turbulence
        f.x += f.vx;
        f.y += f.vy;
        f.angle += f.spin;
        const lt = f.life / f.maxLife;
        const fa = f.opacity * (1 - lt * lt);
        drawFeatherShape(ctx, f.x, f.y, f.angle, f.len, f.width,
          clamp(f.r, 0, 255), clamp(f.g, 0, 255), clamp(f.b, 0, 255), fa);
      });

      // ── FLAME PARTICLES (hands burning near sun, ~0-22% scroll) ───────────
      if (scroll < 0.25) {
        const flameT = clamp(1 - scroll / 0.25, 0, 1);
        if (Math.random() < flameT * 0.7) {
          const fSrc = Math.random() < 0.5
            ? [lHandX, lHandY] : [rHandX, rHandY];
          flamesRef.current.push({
            x: fSrc[0] + (Math.random() - 0.5) * u(3),
            y: fSrc[1] + (Math.random() - 0.5) * u(3),
            vx: (Math.random() - 0.5) * u(0.5),
            vy: -u(0.4) - Math.random() * u(0.6),
            radius: u(1.2) + Math.random() * u(2),
            opacity: 0.6 + Math.random() * 0.4,
            life: 0, maxLife: 30 + Math.random() * 30,
          });
        }
        if (flamesRef.current.length > 80) flamesRef.current.splice(0, 20);
      }

      flamesRef.current = flamesRef.current.filter(f => f.life < f.maxLife);
      flamesRef.current.forEach(f => {
        f.life++;
        f.vy -= 0.015;
        f.x += f.vx;
        f.y += f.vy;
        const lt = f.life / f.maxLife;
        const fa = f.opacity * (1 - lt);
        const fr = Math.round(lerp(255, 255, lt));
        const fg = Math.round(lerp(220, 60, lt));
        const fb = Math.round(lerp(80, 0, lt));
        const flameGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * 2);
        flameGrad.addColorStop(0, `rgba(${fr},${fg},${fb},${fa})`);
        flameGrad.addColorStop(1, `rgba(${fr},${fb},0,0)`);
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = flameGrad;
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
        opacity: 0.6,
        pointerEvents: "none",
      }}
    />
  );
}
