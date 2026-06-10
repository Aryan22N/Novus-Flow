"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
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
  Briefcase
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
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    }
    syncSize();

    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

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

    window.addEventListener('mousemove', onMouseMove);

    function render(t: number) {
      if (typeof ResizeObserver === 'undefined') syncSize();
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
      window.removeEventListener('mousemove', onMouseMove);
      if (resizeObserver && canvas) {
        resizeObserver.unobserve(canvas);
      }
    };
  }, []);

  useEffect(() => {
    const nav = document.getElementById('navbar');
    const handleScroll = () => {
      if (!nav) return;
      if (window.scrollY > 20) {
        nav.classList.add('shadow-sm');
        nav.classList.replace('bg-background/80', 'bg-surface-container-lowest/95');
      } else {
        nav.classList.remove('shadow-sm');
        nav.classList.replace('bg-surface-container-lowest/95', 'bg-background/80');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased overflow-x-hidden relative min-h-screen">
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
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-40">
        <div className="absolute inset-0 w-full h-full" style={{ display: 'block' }}>
          <canvas
            ref={canvasRef}
            id="shader-canvas-ANIMATION_19"
            style={{ display: 'block', width: '100%', height: '100%' }}
          ></canvas>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/30 transition-all duration-300"
        id="navbar"
      >
        <div className="flex justify-between items-center w-full px-4 py-4 max-w-7xl mx-auto">
          {/* Brand Logo with native Lucide Sparkles fallback layout */}
          <Link className="flex items-center gap-2 group" href="/">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white group-hover:opacity-80 transition-opacity">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-on-surface tracking-tight">Nexus Flow</span>
          </Link>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors duration-200" href="#features">Features</Link>
            <Link className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors duration-200" href="#pricing">Pricing</Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link className="hidden md:block text-sm font-medium text-on-surface-variant hover:text-primary transition-colors duration-200" href="/sign-in">Log in</Link>
            <Link className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-all shadow-sm" href="/inbox">Get Started</Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-24">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold tracking-wide uppercase mb-8 opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Introducing Nexus Flow AI</span>
          </div>
          <h1
            className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight text-on-surface max-w-4xl mb-6 opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            The Intelligent <br className="hidden md:block" />
            <span className="ai-gradient-text">Flow of Work.</span>
          </h1>
          <p
            className="text-lg text-on-surface-variant max-w-2xl mb-10 opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            Experience the world's first AI-native email and calendar workspace. Built for speed, precision, and focus.
          </p>
          <div
            className="flex flex-col sm:flex-row items-center gap-4 opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            <Link
              className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 w-full sm:w-auto text-center flex items-center justify-center gap-2"
              href="/inbox"
            >
              Get Started for Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              className="bg-white text-on-surface border border-outline-variant px-6 py-3 rounded-lg font-medium hover:bg-slate-50 transition-colors w-full sm:w-auto text-center flex items-center justify-center gap-2"
              href="#"
            >
              <PlayCircle className="h-4 w-4 text-on-surface-variant" />
              Watch the Film
            </Link>
          </div>
        </section>

        {/* Product Preview Mockup */}
        <section
          className="max-w-[1200px] mx-auto mt-20 px-4 md:px-8 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.6s' }}
        >
          <div className="glass-panel rounded-xl border border-outline-variant/50 overflow-hidden shadow-2xl animate-float relative">
            {/* Browser/App Header */}
            <div className="h-10 bg-slate-100/80 border-b border-outline-variant/30 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            {/* App Layout */}
            <div className="flex h-[600px] bg-white text-left">
              {/* Sidebar Nav */}
              <div className="w-16 bg-slate-50 border-r border-outline-variant/30 flex flex-col items-center py-4 gap-6">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Inbox className="h-4 w-4" />
                </div>
                <div className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              {/* Main Content (Priority Inbox) */}
              <div className="flex-1 flex flex-col bg-white">
                {/* Top Bar */}
                <div className="h-14 border-b border-outline-variant/30 flex items-center px-6 justify-between">
                  <div className="font-semibold text-slate-700">Priority Inbox</div>
                  <div className="flex items-center gap-4 text-slate-400">
                    <Search className="h-4 w-4 cursor-pointer hover:text-slate-600 transition-colors" />
                    <SlidersHorizontal className="h-4 w-4 cursor-pointer hover:text-slate-600 transition-colors" />
                  </div>
                </div>
                {/* Email List */}
                <div className="flex-1 overflow-hidden p-4 flex flex-col gap-2">
                  {/* AI Highlighted Item */}
                  <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <div className="font-medium text-slate-800">Q3 Strategy Review</div>
                        <div className="text-xs text-slate-400">10:42 AM</div>
                      </div>
                      <div className="text-xs text-slate-500 mb-2">Sarah Jenkins, Team Alpha</div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-blue-100 text-xs font-medium text-blue-700 shadow-sm">
                        <Sparkles className="h-3 w-3 text-blue-500" />
                        AI Summary: Action items for upcoming board meeting.
                      </div>
                    </div>
                  </div>
                  {/* Standard Items */}
                  <div className="p-4 rounded-lg bg-white border border-transparent hover:border-slate-100 flex items-start gap-4 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <div className="font-medium text-slate-800">Design System Updates</div>
                        <div className="text-xs text-slate-400">Yesterday</div>
                      </div>
                      <div className="text-xs text-slate-500">Review the new token structure before launch.</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Collapsed Nexus Assistant Rail */}
              <div className="w-12 bg-slate-50 border-l border-outline-variant/30 flex flex-col items-center py-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-all">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="max-w-7xl mx-auto px-4 mt-32 text-left" id="features">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-on-surface mb-4">Orchestrate your workflow</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">A unified workspace designed to minimize context switching and maximize deep work.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="glass-panel p-8 rounded-xl border border-outline-variant/40 transition-all duration-300 ai-glow-hover flex flex-col">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-3">Priority Management</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                AI-driven categorization that clears the noise. Focus only on what matters right now.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="glass-panel p-8 rounded-xl border border-outline-variant/40 transition-all duration-300 ai-glow-hover flex flex-col">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-3">Unified Calendar</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Side-by-side orchestration of your time and communication in a single fluid interface.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="glass-panel p-8 rounded-xl border border-outline-variant/40 transition-all duration-300 ai-glow-hover flex flex-col relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-6 relative z-10">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-3 relative z-10">Nexus Assistant</h3>
              <p className="text-sm text-slate-500 leading-relaxed relative z-10">
                A persistent intelligence that summarizes threads, drafts responses, and schedules meetings.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-outline-variant/30 mt-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-4 py-12 max-w-7xl mx-auto gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-bold text-on-surface">Nexus Flow</span>
            <span className="text-xs text-slate-400">© 2026 Nexus Flow. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <Link className="text-xs text-slate-400 hover:text-on-surface transition-colors" href="#">Privacy Policy</Link>
            <Link className="text-xs text-slate-400 hover:text-on-surface transition-colors" href="#">Terms of Service</Link>
            <Link className="text-xs text-slate-400 hover:text-on-surface transition-colors" href="#">Security</Link>
            <Link className="text-xs text-slate-400 hover:text-on-surface transition-colors" href="#">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}