"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { authClient } from "~/server/better-auth/client";
// Imported high-quality Lucide Icons
import {
  Sparkles,
  ArrowRight,
  PlayCircle,
  Inbox,
  Calendar,
  Users,
  Search,
  SlidersHorizontal,
  Briefcase,
} from "lucide-react";

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId: number;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    }
    syncSize();

    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    vec2 mouse = u_mouse / u_resolution;
    
    float t = u_time * 0.1;
    
    float color1 = sin(uv.x * 3.0 + t) * 0.5 + 0.5;
    float color2 = sin(uv.y * 4.0 - t * 0.8) * 0.5 + 0.5;
    
    float interference = sin(uv.x * 10.0 + uv.y * 8.0 + t * 0.7) * 0.1;
    
    vec3 colorBlue = vec3(0.102, 0.451, 0.910); // #1A73E8
    vec3 colorIndigo = vec3(0.239, 0.169, 0.859); // #3D2BDB
    vec3 colorSurface = vec3(0.973, 0.976, 0.980); // #f8f9fa
    
    float mixFactor = clamp(color1 * color2 + interference, 0.0, 1.0);
    vec3 finalColor = mix(colorBlue, colorIndigo, mixFactor);
    
    float dist = distance(uv, mouse);
    float glow = smoothstep(0.4, 0.0, dist) * 0.15;
    finalColor += colorBlue * glow;
    
    float vignette = smoothstep(1.5, 0.5, length(uv - 0.5));
    finalColor = mix(colorSurface, finalColor, vignette * 0.4);
    
    gl_FragColor = vec4(finalColor, 1.0);
}`;

    function cs(type: number, src: string) {
      if (!gl) return null;
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    if (!prog) return;

    const vertexShader = cs(gl.VERTEX_SHADER, vs);
    const fragmentShader = cs(gl.FRAGMENT_SHADER, fs);
    if (!vertexShader || !fragmentShader) return;

    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };

    window.addEventListener("mousemove", onMouseMove);

    function render(t: number) {
      if (typeof ResizeObserver === "undefined") syncSize();
      if (!gl || !canvas) return;

      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    }

    render(0);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", onMouseMove);
      if (resizeObserver && canvas) {
        resizeObserver.unobserve(canvas);
      }
    };
  }, []);

  useEffect(() => {
    const nav = document.getElementById("navbar");
    const handleScroll = () => {
      if (!nav) return;
      if (window.scrollY > 20) {
        nav.classList.add("shadow-sm");
        nav.classList.replace(
          "bg-background/80",
          "bg-surface-container-lowest/95",
        );
      } else {
        nav.classList.remove("shadow-sm");
        nav.classList.replace(
          "bg-surface-container-lowest/95",
          "bg-background/80",
        );
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-surface font-body-md text-on-surface relative min-h-screen overflow-x-hidden antialiased">
      <style>{`
        .glass-panel {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
        }
        .ai-gradient-text {
            background: linear-gradient(135deg, #1a73e8 0%, #6063ee 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .ai-glow-hover:hover {
            box-shadow: 0 4px 30px rgba(96, 99, 238, 0.15);
            border-color: rgba(96, 99, 238, 0.3);
            transform: translateY(-2px);
        }
        @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
      `}</style>

      {/* Background Shader */}
      <div className="pointer-events-none fixed inset-0 z-[-1] opacity-40">
        <div
          className="absolute inset-0 h-full w-full"
          style={{ display: "block" }}
        >
          <canvas
            ref={canvasRef}
            id="shader-canvas-ANIMATION_19"
            style={{ display: "block", width: "100%", height: "100%" }}
          ></canvas>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="bg-background/80 border-outline-variant/30 fixed top-0 z-50 w-full border-b backdrop-blur-md transition-all duration-300"
        id="navbar"
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
          {/* Brand Logo with native Lucide Sparkles fallback layout */}
          <Link className="group flex items-center gap-2" href="/">
            <div className="from-primary to-secondary flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br text-white transition-opacity group-hover:opacity-80">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-on-surface text-xl font-bold tracking-tight">
              Nexus Flow
            </span>
          </Link>

          {/* Links */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              className="text-on-surface-variant hover:text-primary text-sm font-medium transition-colors duration-200"
              href="#features"
            >
              Features
            </Link>
            <Link
              className="text-on-surface-variant hover:text-primary text-sm font-medium transition-colors duration-200"
              href="#pricing"
            >
              Pricing
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={async () =>
                await authClient.signIn.social({
                  provider: "google",
                  callbackURL: "/onboarding",
                })
              }
              className="text-on-surface-variant hover:text-primary hidden cursor-pointer text-sm font-medium transition-colors duration-200 md:block"
            >
              Log in
            </button>
            <button
              onClick={async () =>
                await authClient.signIn.social({
                  provider: "google",
                  callbackURL: "/onboarding",
                })
              }
              className="bg-primary hover:bg-opacity-90 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-24">
        {/* Hero Section */}
        <section className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-4 text-center">
          <div
            className="animate-fade-in-up mb-8 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-600 uppercase opacity-0"
            style={{ animationDelay: "0.1s" }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Introducing Nexus Flow AI</span>
          </div>
          <h1
            className="text-on-surface animate-fade-in-up mb-6 max-w-4xl text-4xl leading-tight font-extrabold tracking-tight opacity-0 md:text-6xl"
            style={{ animationDelay: "0.2s" }}
          >
            The Intelligent <br className="hidden md:block" />
            <span className="ai-gradient-text">Flow of Work.</span>
          </h1>
          <p
            className="text-on-surface-variant animate-fade-in-up mb-10 max-w-2xl text-lg opacity-0"
            style={{ animationDelay: "0.3s" }}
          >
            Experience the world's first AI-native email and calendar workspace.
            Built for speed, precision, and focus.
          </p>
          <div
            className="animate-slideUp flex flex-col items-center justify-center gap-4 opacity-0 sm:flex-row"
            style={{ animationDelay: "0.4s" }}
          >
            <button
              onClick={async () =>
                await authClient.signIn.social({
                  provider: "google",
                  callbackURL: "/onboarding",
                })
              }
              className="from-primary to-secondary flex w-full transform cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r px-6 py-3 text-center font-medium text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
            >
              Get Started for Free
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              className="text-on-surface border-outline-variant flex w-full items-center justify-center gap-2 rounded-lg border bg-white px-6 py-3 text-center font-medium transition-colors hover:bg-slate-50 sm:w-auto"
              href="#"
            >
              <PlayCircle className="text-on-surface-variant h-4 w-4" />
              Watch the Film
            </Link>
          </div>
        </section>

        {/* Product Preview Mockup */}
        <section
          className="animate-fade-in-up mx-auto mt-20 max-w-[1200px] px-4 opacity-0 md:px-8"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="glass-panel border-outline-variant/50 animate-float relative overflow-hidden rounded-xl border shadow-2xl">
            {/* Browser/App Header */}
            <div className="border-outline-variant/30 flex h-10 items-center gap-2 border-b bg-slate-100/80 px-4">
              <div className="h-3 w-3 rounded-full bg-red-400"></div>
              <div className="h-3 w-3 rounded-full bg-amber-400"></div>
              <div className="h-3 w-3 rounded-full bg-green-400"></div>
            </div>
            {/* App Layout */}
            <div className="flex h-[600px] bg-white text-left">
              {/* Sidebar Nav */}
              <div className="border-outline-variant/30 flex w-16 flex-col items-center gap-6 border-r bg-slate-50 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Inbox className="h-4 w-4" />
                </div>
                <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              {/* Main Content (Priority Inbox) */}
              <div className="flex flex-1 flex-col bg-white">
                {/* Top Bar */}
                <div className="border-outline-variant/30 flex h-14 items-center justify-between border-b px-6">
                  <div className="font-semibold text-slate-700">
                    Priority Inbox
                  </div>
                  <div className="flex items-center gap-4 text-slate-400">
                    <Search className="h-4 w-4 cursor-pointer transition-colors hover:text-slate-600" />
                    <SlidersHorizontal className="h-4 w-4 cursor-pointer transition-colors hover:text-slate-600" />
                  </div>
                </div>
                {/* Email List */}
                <div className="flex flex-1 flex-col gap-2 overflow-hidden p-4">
                  {/* AI Highlighted Item */}
                  <div className="flex items-start gap-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-baseline justify-between">
                        <div className="font-medium text-slate-800">
                          Q3 Strategy Review
                        </div>
                        <div className="text-xs text-slate-400">10:42 AM</div>
                      </div>
                      <div className="mb-2 text-xs text-slate-500">
                        Sarah Jenkins, Team Alpha
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-white px-2 py-1 text-xs font-medium text-blue-700 shadow-sm">
                        <Sparkles className="h-3 w-3 text-blue-500" />
                        AI Summary: Action items for upcoming board meeting.
                      </div>
                    </div>
                  </div>
                  {/* Standard Items */}
                  <div className="flex items-start gap-4 rounded-lg border border-transparent bg-white p-4 transition-colors hover:border-slate-100">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-baseline justify-between">
                        <div className="font-medium text-slate-800">
                          Design System Updates
                        </div>
                        <div className="text-xs text-slate-400">Yesterday</div>
                      </div>
                      <div className="text-xs text-slate-500">
                        Review the new token structure before launch.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Collapsed Nexus Assistant Rail */}
              <div className="border-outline-variant/30 flex w-12 flex-col items-center border-l bg-slate-50 py-4">
                <div className="from-primary to-secondary flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br text-white shadow-sm transition-all hover:shadow-md">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section
          className="mx-auto mt-32 max-w-7xl px-4 text-left"
          id="features"
        >
          <div className="mb-16 text-center">
            <h2 className="text-on-surface mb-4 text-3xl font-bold">
              Orchestrate your workflow
            </h2>
            <p className="mx-auto max-w-2xl text-slate-500">
              A unified workspace designed to minimize context switching and
              maximize deep work.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="glass-panel border-outline-variant/40 ai-glow-hover flex flex-col rounded-xl border p-8 transition-all duration-300">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <h3 className="text-on-surface mb-3 text-lg font-semibold">
                Priority Management
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                AI-driven categorization that clears the noise. Focus only on
                what matters right now.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="glass-panel border-outline-variant/40 ai-glow-hover flex flex-col rounded-xl border p-8 transition-all duration-300">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-on-surface mb-3 text-lg font-semibold">
                Unified Calendar
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Side-by-side orchestration of your time and communication in a
                single fluid interface.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="glass-panel border-outline-variant/40 ai-glow-hover relative flex flex-col overflow-hidden rounded-xl border p-8 transition-all duration-300">
              <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl"></div>
              <div className="relative z-10 mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-on-surface relative z-10 mb-3 text-lg font-semibold">
                Nexus Assistant
              </h3>
              <p className="relative z-10 text-sm leading-relaxed text-slate-500">
                A persistent intelligence that summarizes threads, drafts
                responses, and schedules meetings.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-outline-variant/30 mt-auto w-full border-t bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <span className="text-on-surface font-bold">Nexus Flow</span>
            <span className="text-xs text-slate-400">
              © 2026 Nexus Flow. All rights reserved.
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <Link
              className="hover:text-on-surface text-xs text-slate-400 transition-colors"
              href="#"
            >
              Privacy Policy
            </Link>
            <Link
              className="hover:text-on-surface text-xs text-slate-400 transition-colors"
              href="#"
            >
              Terms of Service
            </Link>
            <Link
              className="hover:text-on-surface text-xs text-slate-400 transition-colors"
              href="#"
            >
              Security
            </Link>
            <Link
              className="hover:text-on-surface text-xs text-slate-400 transition-colors"
              href="#"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
