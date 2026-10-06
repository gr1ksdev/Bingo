"use client";
import { useCallback, useEffect, useRef, type PointerEvent } from "react";
import type { Stroke } from "@/lib/bingo/types";
import type { DrawingMode } from "./DrawingToolbar";
import { MAX_STROKE_POINTS } from "@/lib/drawing";
function paint(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  w: number,
  h: number,
) {
  ctx.globalCompositeOperation =
    stroke.tool === "eraser" ? "destination-out" : "source-over";
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.width * w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const first = stroke.points[0];
  if (!first) return;
  ctx.beginPath();
  if (stroke.points.length === 1) {
    ctx.arc(first.x * w, first.y * h, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.moveTo(first.x * w, first.y * h);
  stroke.points.slice(1).forEach((p) => ctx.lineTo(p.x * w, p.y * h));
  ctx.stroke();
}
export function DrawingCanvas({
  strokes,
  mode,
  color,
  width,
  onStroke,
}: {
  strokes: Stroke[];
  mode: DrawingMode;
  color: string;
  width: number;
  onStroke: (s: Stroke) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const active = useRef<Stroke | null>(null);
  const pointer = useRef<number | null>(null);
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(width * dpr),
      h = Math.round(height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    strokes.forEach((s) => paint(ctx, s, width, height));
    if (active.current) paint(ctx, active.current, width, height);
    ctx.globalCompositeOperation = "source-over";
  }, [strokes]);
  useEffect(() => {
    redraw();
    const observer = new ResizeObserver(redraw);
    if (canvasRef.current) observer.observe(canvasRef.current);
    window.addEventListener("resize", redraw);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", redraw);
    };
  }, [redraw]);
  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    // Undo the paper's rotation so ink stays under the fingertip.
    let matrix = new DOMMatrix();
    let element: HTMLElement | null = canvas;
    while (element) {
      const transform = getComputedStyle(element).transform;
      if (transform !== "none")
        matrix = new DOMMatrix(transform).multiply(matrix);
      element = element.parentElement;
    }
    matrix.e = 0;
    matrix.f = 0;
    const position = matrix
      .inverse()
      .transformPoint(
        new DOMPoint(
          event.clientX - rect.left - rect.width / 2,
          event.clientY - rect.top - rect.height / 2,
        ),
      );
    return {
      x:
        Math.round(
          Math.max(0, Math.min(1, position.x / canvas.clientWidth + 0.5)) *
            10000,
        ) / 10000,
      y:
        Math.round(
          Math.max(0, Math.min(1, position.y / canvas.clientHeight + 0.5)) *
            10000,
        ) / 10000,
    };
  };
  const finish = (event: PointerEvent<HTMLCanvasElement>, cancel = false) => {
    if (event.pointerId !== pointer.current) return;
    const stroke = active.current;
    active.current = null;
    pointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (stroke && !cancel) onStroke(stroke);
    redraw();
  };
  return (
    <canvas
      ref={canvasRef}
      className={`drawing-canvas ${mode !== "stamp" ? "drawing-active" : ""}`}
      aria-label="Camada de rabiscos livres. Use toque ou mouse para desenhar."
      onPointerDown={(event) => {
        if (
          mode === "stamp" ||
          pointer.current !== null ||
          !event.isPrimary ||
          event.button !== 0
        )
          return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        pointer.current = event.pointerId;
        active.current = {
          id: crypto.randomUUID(),
          color,
          tool: mode === "eraser" ? "eraser" : "pen",
          width: Math.min(0.1, (mode === "eraser" ? width * 3 : width) / 400),
          points: [point(event)],
        };
        redraw();
      }}
      onPointerMove={(event) => {
        if (pointer.current !== event.pointerId || !active.current) return;
        if (active.current.points.length < MAX_STROKE_POINTS)
          active.current.points.push(point(event));
        redraw();
      }}
      onPointerUp={(event) => finish(event)}
      onPointerCancel={(event) => finish(event, true)}
      onLostPointerCapture={(event) => finish(event, true)}
    />
  );
}
