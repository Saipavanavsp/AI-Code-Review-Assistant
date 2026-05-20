"use client";

import { motion } from "framer-motion";
import { Zap, Archive, ArrowRight } from "lucide-react";
import React, { useEffect, useRef } from "react";

function StarfieldBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const symbols = ["{", "}", "</>", "=>", "[]", "()", "++", "&&", "||", ";", "const", "let"];
    const particles = [];
    const particleCount = 60;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.12,
        speedY: (Math.random() - 0.5) * 0.12,
        alpha: Math.random() * 0.4 + 0.1,
        isSymbol: Math.random() > 0.7,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        fontSize: Math.floor(Math.random() * 6) + 8
      });
    }

    let mouse = { x: null, y: null };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (mouse.x && mouse.y) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const force = (160 - dist) / 160;
            p.x += (dx / dist) * force * 0.6;
            p.y += (dy / dist) * force * 0.6;
          }
        }

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = `rgba(129, 140, 248, ${p.alpha})`;
        if (p.isSymbol) {
          ctx.font = `${p.fontSize}px monospace`;
          ctx.fillText(p.symbol, p.x, p.y);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.strokeStyle = `rgba(99, 102, 241, ${(110 - dist) / 110 * 0.04})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

export default function SelectionCards({ setView }) {
  const cards = [
    {
      id: "face1",
      title: "FACE 1: Batch Review",
      description: "Asynchronous repository scanning via Celery. Full 10-step deep analysis for Pull Requests.",
      icon: <Archive className="text-blue-400" size={32} />,
      color: "from-blue-600/10 to-indigo-600/10",
      border: "border-blue-500/20 hover:border-blue-500/50"
    },
    {
      id: "face2",
      title: "FACE 2: Live Assessment",
      description: "Real-time code evaluation via WebSockets. Instant feedback and active scoring as you type.",
      icon: <Zap className="text-amber-400" size={32} />,
      color: "from-amber-600/10 to-orange-600/10",
      border: "border-amber-500/20 hover:border-amber-500/50"
    }
  ];

  return (
    <div className="py-12 relative min-h-[70vh]">
      <StarfieldBackground />
      <div className="relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            AI Code Review Assistant
          </h1>
          <p className="text-slate-400 text-lg">Choose your review engine to begin the optimization process.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {cards.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setView(card.id)}
              className={`group relative p-8 rounded-3xl border ${card.border} bg-slate-900/60 backdrop-blur-md cursor-pointer transition-all duration-300`}
            >
              <div className="mb-6 bg-slate-950/80 w-16 h-16 rounded-2xl flex items-center justify-center border border-slate-800 shadow-xl group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <h3 className="text-2xl font-bold mb-3">{card.title}</h3>
              <p className="text-slate-400 leading-relaxed mb-8">
                {card.description}
              </p>
              <div className="flex items-center text-sm font-semibold group-hover:gap-3 gap-2 transition-all">
                Launch Instance <ArrowRight size={16} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
