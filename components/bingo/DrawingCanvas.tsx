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

function getInverseTransformMatrix(element: HTMLElement | null): DOMMatrix {
  let matrix = new DOMMatrix();
  let current: HTMLElement | null = element;
  while (current) {
    const transform = getComputedStyle(current).transform;
    if (transform && transform !== "none") {
      matrix = new DOMMatrix(transform).multiply(matrix);
    }
    current = current.parentElement;
  }
  matrix.e = 0;
  matrix.f = 0;
  return matrix.inverse();
}

export function DrawingCanvas({
  strokes,
  mode,
  color,
  width,
  onStroke,
  onEraseCell,
}: {
  strokes: Stroke[];
  mode: DrawingMode;
  color: string;
  width: number;
  onStroke: (s: Stroke) => void;
  onEraseCell?: (index: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const active = useRef<Stroke | null>(null);
  const pointer = useRef<number | null>(null);
  const inverseMatrix = useRef<DOMMatrix | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const clientW = canvas.clientWidth;
    const clientH = canvas.clientHeight;
    if (clientW <= 0 || clientH <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(clientW * dpr);
    const h = Math.round(clientH * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    // Reset transform to identity to clear physical buffer cleanly across fractional DPRs
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    strokes.forEach((s) => paint(ctx, s, clientW, clientH));
    if (active.current) paint(ctx, active.current, clientW, clientH);
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

  const calculatePoint = (
    event: PointerEvent<HTMLCanvasElement>,
    matrixInv: DOMMatrix,
  ) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const clientW = canvas.clientWidth || 1;
    const clientH = canvas.clientHeight || 1;

    // Vector relative to the center of the canvas bounding box in viewport space
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;

    // Transform by inverse rotation matrix so ink tracks fingertip precisely
    const unrotated = matrixInv.transformPoint(new DOMPoint(dx, dy));

    const normalizedX = (unrotated.x + clientW / 2) / clientW;
    const normalizedY = (unrotated.y + clientH / 2) / clientH;

    return {
      x: Math.round(Math.max(0, Math.min(1, normalizedX)) * 10000) / 10000,
      y: Math.round(Math.max(0, Math.min(1, normalizedY)) * 10000) / 10000,
    };
  };

  const finish = (event: PointerEvent<HTMLCanvasElement>, cancel = false) => {
    if (event.pointerId !== pointer.current) return;
    const stroke = active.current;
    active.current = null;
    pointer.current = null;
    inverseMatrix.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
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

        const inv = getInverseTransformMatrix(event.currentTarget);
        inverseMatrix.current = inv;

        if (mode === "eraser" && onEraseCell) {
          const point = calculatePoint(event, inv);
          const grid =
            event.currentTarget.parentElement?.querySelector<HTMLElement>(
              ".number-grid",
            );
          if (grid) {
            const x =
              point.x * event.currentTarget.clientWidth - grid.offsetLeft;
            const y =
              point.y * event.currentTarget.clientHeight - grid.offsetTop;
            if (
              x >= 0 &&
              y >= 0 &&
              x < grid.offsetWidth &&
              y < grid.offsetHeight
            ) {
              onEraseCell(
                Math.floor((y / grid.offsetHeight) * 5) * 5 +
                  Math.floor((x / grid.offsetWidth) * 5),
              );
            }
          }
        }
        active.current = {
          id: crypto.randomUUID(),
          color,
          tool: mode === "eraser" ? "eraser" : "pen",
          width: Math.min(0.1, (mode === "eraser" ? width * 3 : width) / 400),
          points: [calculatePoint(event, inv)],
        };
        redraw();
      }}
      onPointerMove={(event) => {
        if (pointer.current !== event.pointerId || !active.current) return;
        const inv =
          inverseMatrix.current ??
          getInverseTransformMatrix(event.currentTarget);
        if (active.current.points.length < MAX_STROKE_POINTS) {
          active.current.points.push(calculatePoint(event, inv));
        }
        redraw();
      }}
      onPointerUp={(event) => finish(event)}
      onPointerCancel={(event) => finish(event, true)}
      onLostPointerCapture={(event) => finish(event, true)}
    />
  );
}
