"use client";
import { useEffect, useRef } from "react";

export function AuroraBackground() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(600px circle at var(--mx,30%) var(--my,20%), rgba(26,115,232,0.18), transparent 60%), radial-gradient(700px circle at calc(100% - var(--mx,30%)) calc(100% - var(--my,20%)), rgba(96,99,238,0.18), transparent 60%), radial-gradient(1200px circle at 50% -10%, rgba(232,240,254,0.9), transparent 60%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,24,40,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(16,24,40,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at 50% 30%, black 40%, transparent 75%)",
        }}
      />
    </div>
  );
}

export function Particles({ count = 18 }: { count?: number }) {
  const items = Array.from({ length: count });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((_, i) => {
        const left = (i * 53) % 100;
        const top = (i * 37) % 100;
        const size = 4 + ((i * 7) % 10);
        const delay = (i % 7) * 0.6;
        const duration = 6 + (i % 5);
        return (
          <span
            key={i}
            className="absolute rounded-full"
            suppressHydrationWarning
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              background:
                "radial-gradient(circle, rgba(26,115,232,0.9), rgba(96,99,238,0.2) 60%, transparent 70%)",
              filter: "blur(0.4px)",
              animation: `float-y ${duration}s ease-in-out ${delay}s infinite`,
              opacity: 0.6,
            }}
          />
        );
      })}
    </div>
  );
}
