/** @format */
"use client";

import { useEffect } from "react";

export function CardCursorGlowBinder() {
  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const card = target?.closest('[data-slot="card"]') as HTMLElement | null;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      card.style.setProperty("--mx", `${x}px`);
      card.style.setProperty("--my", `${y}px`);
    };

    document.addEventListener("pointermove", onPointerMove);
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return null;
}
