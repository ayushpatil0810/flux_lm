"use client";

import * as React from "react";

interface UsePanelResizeOptions {
  id?: string;
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  /** Which side this panel is on — determines drag direction. */
  side: "left" | "right";
}

interface UsePanelResizeResult {
  width: number;
  onMouseDown: (e: React.MouseEvent) => void;
}

/**
 * Minimal drag-to-resize hook for a panel.
 * On the left side, dragging right expands; on the right, dragging left expands.
 */
export function usePanelResize({
  id,
  initialWidth,
  minWidth,
  maxWidth,
  side,
}: UsePanelResizeOptions): UsePanelResizeResult {
  const [width, setWidth] = React.useState(initialWidth);
  const currentWidth = React.useRef(initialWidth);
  const dragging = React.useRef(false);
  const startX = React.useRef(0);
  const startWidth = React.useRef(0);

  React.useEffect(() => {
    if (id) {
      const saved = localStorage.getItem(`flux-panel-${id}`);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) {
          const valid = Math.min(maxWidth, Math.max(minWidth, parsed));
          setWidth(valid);
          currentWidth.current = valid;
        }
      }
    }
  }, [id, minWidth, maxWidth]);

  const onMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startWidth.current = currentWidth.current;

      function onMouseMove(ev: MouseEvent) {
        if (!dragging.current) return;
        const delta =
          side === "left"
            ? ev.clientX - startX.current
            : startX.current - ev.clientX;
        const next = Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta));
        currentWidth.current = next;
        setWidth(next);
      }

      function onMouseUp() {
        dragging.current = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        if (id) {
          localStorage.setItem(`flux-panel-${id}`, currentWidth.current.toString());
        }
      }

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [id, side, minWidth, maxWidth],
  );

  return { width, onMouseDown };
}
