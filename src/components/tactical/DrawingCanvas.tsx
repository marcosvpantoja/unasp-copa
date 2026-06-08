import { useEffect, useImperativeHandle, useRef, forwardRef, useState } from "react";
import type { PenStyle, Rotation } from "@/hooks/useTacticalBoard";

interface Props {
  active: boolean;
  color: string;
  style: PenStyle;
  rotation: Rotation;
}

export interface DrawingCanvasHandle {
  clear: () => void;
}

interface Stroke {
  color: string;
  style: PenStyle;
  /** Normalized 0-1 points stored in horizontal frame */
  points: { x: number; y: number }[];
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas(
  { active, color, style, rotation },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const drawing = useRef(false);
  const currentStroke = useRef<Stroke | null>(null);
  const [, forceTick] = useState(0);

  // Map normalized display coords (0..1) back to horizontal frame (0..1).
  const toHorizFrame = (dx: number, dy: number) => {
    switch (rotation) {
      case 90:
        return { x: dy, y: 1 - dx };
      case 180:
        return { x: 1 - dx, y: 1 - dy };
      case 270:
        return { x: 1 - dy, y: dx };
      case 0:
      default:
        return { x: dx, y: dy };
    }
  };

  // Map horizontal-frame point (0..1) to current display pixel coords.
  const toDisplay = (p: { x: number; y: number }, w: number, h: number) => {
    switch (rotation) {
      case 90:
        return { px: (1 - p.y) * w, py: p.x * h };
      case 180:
        return { px: (1 - p.x) * w, py: (1 - p.y) * h };
      case 270:
        return { px: p.y * w, py: (1 - p.x) * h };
      case 0:
      default:
        return { px: p.x * w, py: p.y * h };
    }
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const all = currentStroke.current ? [...strokes, currentStroke.current] : strokes;
    for (const s of all) {
      if (s.points.length < 1) continue;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 3 * dpr;
      ctx.setLineDash(s.style === "dashed" ? [10 * dpr, 8 * dpr] : []);
      ctx.beginPath();
      const first = toDisplay(s.points[0], canvas.width, canvas.height);
      ctx.moveTo(first.px, first.py);
      for (let i = 1; i < s.points.length; i++) {
        const p = toDisplay(s.points[i], canvas.width, canvas.height);
        ctx.lineTo(p.px, p.py);
      }
      ctx.stroke();
    }
  };

  // Resize canvas and redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      redraw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotation, strokes]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      currentStroke.current = null;
      setStrokes([]);
    },
  }));

  const getNorm = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      dx: (e.clientX - rect.left) / rect.width,
      dy: (e.clientY - rect.top) / rect.height,
    };
  };

  const handleDown = (e: React.PointerEvent) => {
    if (!active) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drawing.current = true;
    const { dx, dy } = getNorm(e);
    currentStroke.current = {
      color,
      style,
      points: [toHorizFrame(dx, dy)],
    };
    forceTick((n) => n + 1);
    redraw();
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!active || !drawing.current || !currentStroke.current) return;
    const { dx, dy } = getNorm(e);
    currentStroke.current.points.push(toHorizFrame(dx, dy));
    redraw();
  };

  const handleUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (currentStroke.current && currentStroke.current.points.length > 1) {
      const s = currentStroke.current;
      currentStroke.current = null;
      setStrokes((prev) => [...prev, s]);
    } else {
      currentStroke.current = null;
      redraw();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{
        pointerEvents: active ? "auto" : "none",
        cursor: active ? "crosshair" : "default",
        touchAction: "none",
        zIndex: active ? 30 : 10,
      }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    />
  );
});
