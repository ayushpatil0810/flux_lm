"use client";

import * as React from "react";

interface UsePanelResizeOptions {
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
  initialWidth,
  minWidth,
  maxWidth,
  side,
}: UsePanelResizeOptions): UsePanelResizeResult {
  const [width, setWidth] = React.useState(initialWidth);
  const dragging = React.useRef(false);
  const startX = React.useRef(0);
  const startWidth = React.useRef(0);

  const onMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startWidth.current = width;

      function onMouseMove(ev: MouseEvent) {
        if (!dragging.current) return;
        const delta =
          side === "left"
            ? ev.clientX - startX.current
            : startX.current - ev.clientX;
        const next = Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta));
        setWidth(next);
      }

      function onMouseUp() {
        dragging.current = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [width, side, minWidth, maxWidth],
  );

  return { width, onMouseDown };
}
