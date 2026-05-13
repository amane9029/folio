"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

// --- Interactive Trail Grid Component ---
const InteractiveGrid = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cells = useRef<{x: number, y: number, alpha: number}[]>([]);
  const cellSize = 50; // Size of the grid cells

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let cols = 0;
    let rows = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.ceil(canvas.width / cellSize);
      rows = Math.ceil(canvas.height / cellSize);
      
      cells.current = [];
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          cells.current.push({ x: i, y: j, alpha: 0 });
        }
      }
    };

    window.addEventListener('resize', resize);
    resize();

    let lastMousePos = { x: -1, y: -1 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (lastMousePos.x === -1 && lastMousePos.y === -1) {
        lastMousePos = { x, y };
      }

      // Interpolate between last and current mouse positions to fill gaps
      const dx = x - lastMousePos.x;
      const dy = y - lastMousePos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(Math.ceil(distance / (cellSize / 3)), 1);

      for (let i = 0; i <= steps; i++) {
        const interpX = lastMousePos.x + (dx * i) / steps;
        const interpY = lastMousePos.y + (dy * i) / steps;

        const col = Math.floor(interpX / cellSize);
        const row = Math.floor(interpY / cellSize);
        
        const cell = cells.current.find(c => c.x === col && c.y === row);
        if (cell) {
          cell.alpha = 1;
        }
        
        // Light up neighbors slightly to create a smoother, softer trail
        const neighbors = [
          { dx: 0, dy: -1, a: 0.5 },
          { dx: 0, dy: 1, a: 0.5 },
          { dx: -1, dy: 0, a: 0.5 },
          { dx: 1, dy: 0, a: 0.5 },
          { dx: -1, dy: -1, a: 0.3 },
          { dx: 1, dy: 1, a: 0.3 },
          { dx: -1, dy: 1, a: 0.3 },
          { dx: 1, dy: -1, a: 0.3 },
        ];
        neighbors.forEach(n => {
          const neighbor = cells.current.find(c => c.x === col + n.dx && c.y === row + n.dy);
          if (neighbor && neighbor.alpha < n.a) {
             neighbor.alpha = n.a;
          }
        });
      }

      lastMousePos = { x, y };
    };

    const handleMouseLeave = () => {
      lastMousePos = { x: -1, y: -1 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      for (let i = 0; i <= cols; i++) {
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
      }
      for (let j = 0; j <= rows; j++) {
        ctx.moveTo(0, j * cellSize);
        ctx.lineTo(canvas.width, j * cellSize);
      }
      ctx.stroke();

      // Draw fading trail cells
      cells.current.forEach(cell => {
        if (cell.alpha > 0.01) {
          // It fades from bright white/grey to transparent
          ctx.fillStyle = `rgba(255, 255, 255, ${cell.alpha * 0.15})`; 
          ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
          cell.alpha *= 0.93; // Smooth slower fade speed
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0" 
    />
  );
};

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/20 overflow-hidden relative">
      
      {/* ─── Interactive Background Grid ─── */}
      <InteractiveGrid />

      {/* ─── Nav ─── */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#050505]/80 backdrop-blur-md border-b border-white/10 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-transparent p-[1px]">
              <div className="relative w-full h-full bg-[#050505] rounded-xl flex items-center justify-center">
                <img src="/main_logo.svg" alt="Folio" className="h-5 w-5 filter invert opacity-100" />
              </div>
            </div>
            <span className="font-serif font-bold text-[22px] tracking-wide select-none text-white">Folio</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#features" className="hidden md:inline text-[14px] font-medium text-white/50 hover:text-white transition-colors relative z-10">Features</a>
            <button
              onClick={() => router.push('/register')}
              className="relative z-10 hidden sm:inline-flex h-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] px-5 text-sm font-semibold text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              Register
            </button>
            <button
              onClick={() => router.push('/login')}
              className="relative z-10 inline-flex h-9 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/90 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative max-w-[1200px] mx-auto px-6 pt-40 pb-20 md:pt-52 md:pb-32 flex flex-col items-center text-center z-10">
        <div className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-full px-4 py-1.5 text-[13px] font-medium tracking-wide text-white/70 mb-8 backdrop-blur-sm animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          Next-Generation Library Manager
        </div>

        <h1 className="font-sans text-[52px] md:text-[84px] font-extrabold leading-[1.05] tracking-tight max-w-4xl text-white animate-slide-up pointer-events-none">
          Your digital bookshelf,<br /> reimagined.
        </h1>

        <p className="mt-8 text-[18px] md:text-[22px] text-white/50 leading-[1.6] max-w-2xl font-light animate-slide-up pointer-events-none" style={{ animationDelay: '100ms' }}>
          Folio is a private, elegant archive for your digital books. Upload EPUBs, organize with ease, and access your collection from any device with a breathtaking interface.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center gap-5 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <button
            onClick={() => router.push('/register')}
            className="group relative px-8 py-4 rounded-full bg-white text-black text-[16px] font-bold hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] cursor-pointer"
          >
            Register for Free
            <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </section>

      {/* ─── 3D/Glass Dashboard Preview ─── */}
      <section className="relative max-w-[1200px] mx-auto px-6 pb-40 z-10 [perspective:1000px]">
        <div className="transform [transform:rotateX(12deg)_scale(0.95)] hover:[transform:rotateX(0deg)_scale(1)] transition-all duration-700 ease-out">
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl shadow-[0_20px_70px_rgba(0,0,0,0.8)] overflow-hidden ring-1 ring-white/5">
            {/* Fake browser bar */}
            <div className="h-12 bg-white/[0.02] border-b border-white/5 flex items-center px-5 gap-2 backdrop-blur-md">
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <div className="ml-4 flex-1 max-w-sm h-6 rounded-md bg-white/5 border border-white/5 flex items-center px-3">
                <span className="text-[11px] text-white/30 font-mono">folio.app/library</span>
              </div>
            </div>

            {/* Mock dashboard content */}
            <div className="p-8 md:p-12 relative overflow-hidden pointer-events-none">
              <div className="absolute top-[-50%] right-[-20%] w-[60%] h-[100%] rounded-full bg-white/[0.03] blur-[80px]" />

              <div className="flex items-end justify-between mb-10 relative z-10 pointer-events-auto">
                <div>
                  <div className="font-serif text-[36px] font-semibold text-white">My Collection</div>
                  <div className="text-[15px] text-white/50 mt-1 flex items-center gap-3">
                    <span>124 books</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span>14 folders</span>
                  </div>
                </div>
                <div className="h-12 w-40 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center gap-2 text-[14px] font-medium text-white/80 shadow-inner hover:bg-white/10 transition-colors cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                  Upload Book
                </div>
              </div>

              {/* Book grid mock */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10 pointer-events-auto">
                {[
                  { title: 'Dune', author: 'Frank Herbert' },
                  { title: 'Neuromancer', author: 'William Gibson' },
                  { title: 'Foundation', author: 'Isaac Asimov' },
                  { title: 'Hyperion', author: 'Dan Simmons' },
                ].map((b, i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="rounded-xl aspect-[2/3] bg-gradient-to-b from-white/10 to-transparent p-[1px] shadow-xl relative overflow-hidden transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(255,255,255,0.05)]">
                      <div className="absolute inset-0 bg-white/[0.02] group-hover:bg-transparent transition-colors" />
                      <div className="w-full h-full rounded-lg bg-[#111] p-4 flex flex-col justify-between relative z-10 border border-white/5 group-hover:border-white/20 transition-colors">
                        <div className="text-[10px] uppercase tracking-widest text-white/30 font-medium">EPUB</div>
                        <div>
                          <div className="font-serif text-[18px] text-white/90 leading-snug mb-1">{b.title}</div>
                          <div className="text-[12px] text-white/50">{b.author}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section id="features" className="relative max-w-[1200px] mx-auto px-6 pb-40 z-10 pointer-events-none">
        <div className="text-center mb-20">
          <h2 className="text-[36px] md:text-[56px] font-bold tracking-tight text-white">
            Engineered for readers.
          </h2>
          <p className="mt-4 text-[18px] text-white/50 max-w-2xl mx-auto">
            Every feature is designed to get out of your way and let you focus on what matters: the books.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pointer-events-auto">
          {/* Feature 1 */}
          <div className="col-span-1 md:col-span-2 rounded-3xl bg-white/[0.02] border border-white/5 p-8 md:p-10 hover:bg-white/[0.04] hover:border-white/10 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full blur-[60px] group-hover:bg-white/[0.04] transition-colors" />
            <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h3 className="text-[24px] font-semibold text-white mb-3">Seamless Parsing</h3>
            <p className="text-[16px] text-white/50 leading-relaxed max-w-md">
              Drop an EPUB anywhere. Folio instantly extracts stunning cover art, author metadata, and organizes it into your collection automatically.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="col-span-1 rounded-3xl bg-white/[0.02] border border-white/5 p-8 md:p-10 hover:bg-white/[0.04] hover:border-white/10 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full blur-[60px] group-hover:bg-white/[0.04] transition-colors" />
            <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="text-[24px] font-semibold text-white mb-3">Absolute Privacy</h3>
            <p className="text-[16px] text-white/50 leading-relaxed">
              Row-level security ensures your library is cryptographically isolated. Your books are yours alone.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="col-span-1 rounded-3xl bg-white/[0.02] border border-white/5 p-8 md:p-10 hover:bg-white/[0.04] hover:border-white/10 transition-all relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/[0.02] rounded-full blur-[60px] group-hover:bg-white/[0.04] transition-colors" />
            <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                <circle cx="12" cy="12" r="10" /><path d="m2 12 5.1 2.2a2 2 0 0 0 2.2-.4l2.5-2.5a2 2 0 0 1 2.2-.4L22 12" />
              </svg>
            </div>
            <h3 className="text-[24px] font-semibold text-white mb-3">AI Translation</h3>
            <p className="text-[16px] text-white/50 leading-relaxed">
              Upload books in any script. Our AI detects and translates titles seamlessly in real-time.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="col-span-1 md:col-span-2 rounded-3xl bg-white/[0.02] border border-white/5 p-8 md:p-10 hover:bg-white/[0.04] hover:border-white/10 transition-all relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full blur-[60px] group-hover:bg-white/[0.04] transition-colors" />
            <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="text-[24px] font-semibold text-white mb-3">Infinite Organization</h3>
            <p className="text-[16px] text-white/50 leading-relaxed max-w-md">
              Create nested folders, tags, and collections. Navigate your library with zero latency thanks to our advanced caching layer.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="relative max-w-[1200px] mx-auto px-6 pb-32 z-10 pointer-events-none">
        <div className="relative rounded-[40px] bg-white/[0.02] border border-white/10 p-12 md:p-20 text-center overflow-hidden hover:border-white/20 transition-colors duration-500 pointer-events-auto">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-white/[0.02] rounded-full blur-[100px] pointer-events-none" />

          <h2 className="relative font-sans text-[40px] md:text-[64px] font-bold text-white leading-tight mb-6">
            Ready to begin?
          </h2>
          <p className="relative text-[18px] md:text-[20px] text-white/50 max-w-xl mx-auto mb-10">
            Join the private beta today and experience the future of digital book management.
          </p>
          <button
            onClick={() => router.push('/register')}
            className="relative h-14 px-10 rounded-full bg-white text-black text-[16px] font-bold hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer"
          >
            Create Free Account
          </button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/10 bg-[#050505] relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10">
              <img src="/main_logo.svg" alt="Folio" className="h-4 w-4 filter invert opacity-70" />
            </div>
            <span className="text-[14px] text-white/40 font-medium">© {new Date().getFullYear()} Folio Inc.</span>
          </div>
          <div className="flex items-center gap-8 text-[14px] font-medium text-white/40">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
